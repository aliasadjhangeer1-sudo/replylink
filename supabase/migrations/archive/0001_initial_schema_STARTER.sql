-- ReplyLink initial schema. Apply in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text,
 plan text not null default 'free' check (plan in ('free','starter','pro','agency')),
 created_at timestamptz not null default now()
);
create table if not exists public.social_accounts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 platform text not null check (platform in ('instagram','facebook')),
 platform_account_id text not null,
 account_name text,
 token_ciphertext text, -- store encrypted tokens via a trusted server-side vault; never expose to browser
 token_expires_at timestamptz,
 status text not null default 'pending' check (status in ('pending','connected','expired','disconnected','error')),
 created_at timestamptz not null default now(),
 unique(user_id, platform, platform_account_id)
);
create table if not exists public.automations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 social_account_id uuid references public.social_accounts(id) on delete set null,
 name text not null,
 keyword text not null,
 match_type text not null default 'contains' check (match_type in ('exact','contains')),
 dm_message text not null,
 link_url text,
 public_reply text,
 public_reply_enabled boolean not null default false,
 enabled boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.comment_events (
 id uuid primary key default gen_random_uuid(),
 automation_id uuid references public.automations(id) on delete set null,
 social_account_id uuid references public.social_accounts(id) on delete set null,
 platform_comment_id text not null unique,
 platform_user_id text,
 comment_text text,
 status text not null default 'received' check(status in ('received','queued','sent','failed','ignored')),
 error_message text,
 created_at timestamptz not null default now(),
 processed_at timestamptz
);
create table if not exists public.leads (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 social_account_id uuid references public.social_accounts(id) on delete set null,
 platform_user_id text,
 username text,
 source_comment_id text,
 created_at timestamptz not null default now()
);
create table if not exists public.usage_monthly (
 user_id uuid not null references auth.users(id) on delete cascade,
 month date not null,
 dm_count integer not null default 0 check(dm_count >= 0),
 primary key(user_id, month)
);
create index if not exists automations_user_idx on public.automations(user_id);
create index if not exists events_created_idx on public.comment_events(created_at desc);
create index if not exists leads_user_idx on public.leads(user_id, created_at desc);
alter table public.profiles enable row level security;
alter table public.social_accounts enable row level security;
alter table public.automations enable row level security;
alter table public.comment_events enable row level security;
alter table public.leads enable row level security;
alter table public.usage_monthly enable row level security;
create policy "profile owner read" on public.profiles for select using (auth.uid() = id);
create policy "profile owner update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "social account owner all" on public.social_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "automation owner all" on public.automations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "event owner read" on public.comment_events for select using (
 exists(select 1 from public.automations a where a.id = automation_id and a.user_id = auth.uid())
);
create policy "lead owner all" on public.leads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "usage owner read" on public.usage_monthly for select using (auth.uid() = user_id);
-- Profile creation trigger
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,email) values(new.id,new.email) on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
