-- ReplyLink — 001_init.sql
-- Supabase Postgres. Run in SQL Editor (or `supabase db push`).
-- Assumptions: Supabase Auth enabled (email + Google). All tables RLS ON.
-- Token encryption: AES-256-GCM in app code (lib/crypto.ts) BEFORE insert; DB stores ciphertext only.
-- Money: USD prices in cents (stripe), PKR in rupees (safepay/payfast). Plans are source of truth in `plans`.

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ── ENUMS ───────────────────────────────────────────────────────────────
do $$ begin
  create type plan_slug as enum ('free','starter','pro','agency');
exception when duplicate_object then null; end $$;
do $$ begin
  create type platform as enum ('instagram','facebook');
exception when duplicate_object then null; end $$;
do $$ begin
  create type automation_status as enum ('active','paused','draft');
exception when duplicate_object then null; end $$;
do $$ begin
  create type match_type as enum ('contains','exact');
exception when duplicate_object then null; end $$;
do $$ begin
  create type log_status as enum ('sent','failed','skipped','queued');
exception when duplicate_object then null; end $$;
do $$ begin
  create type subscription_status as enum ('trialing','active','past_due','grace','canceled','free');
exception when duplicate_object then null; end $$;

-- ── PLANS (seeded below; admin-editable, app reads from here) ──────────
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug plan_slug unique not null,
  name text not null,
  price_usd_cents int not null default 0,   -- monthly, USD cents
  price_pkr int not null default 0,         -- monthly, PKR rupees
  yearly_discount_months int not null default 0, -- yearly = 12 - this months charged (2 = 2 months free)
  max_accounts int not null default 1,
  max_automations int not null,             -- NULL = unlimited (use -1 in seed? use 999999)
  dm_limit_monthly int not null,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.plans (slug,name,price_usd_cents,price_pkr,yearly_discount_months,max_accounts,max_automations,dm_limit_monthly,features) values
 ('free','Free',0,0,0,1,3,100,'["Powered by ReplyLink footer","Basic logs"]'),
 ('starter','Starter',100,150,2,1,5,500,'["No branding","CSV export","Public comment replies"]'),
 ('pro','Pro',1900,5499,2,3,999999,10000,'["Follow-gate flow","Lead export","Priority queue","Keyword variants"]'),
 ('agency','Agency',4900,13999,2,10,999999,50000,'["Team members","White-label","API access","Priority support"]')
on conflict (slug) do nothing;

-- ── PROFILES (1:1 with auth.users) ──────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  locale text not null default 'en', -- 'en' | 'ur' (Roman Urdu toggle stored per user)
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── WORKSPACES + MEMBERS (Agency team) ──────────────────────────────────
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- ── SUBSCRIPTIONS ───────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan_slug plan_slug not null default 'free',
  status subscription_status not null default 'free',
  provider text, -- 'stripe' | 'safepay' | 'payfast' | 'manual'
  provider_subscription_id text,
  provider_customer_id text,
  currency text not null default 'USD' check (currency in ('USD','PKR')),
  trial_ends_at timestamptz,          -- 7-day Pro trial on signup
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_ends_at timestamptz,          -- failed payment: 3-day grace, then downgrade to Free
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id)
);

-- ── SOCIAL ACCOUNTS (tokens ENCRYPTED in app, never plaintext) ──────────
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform platform not null,
  external_id text not null,          -- IG user id / FB Page id
  username text not null,
  display_name text,
  encrypted_token text not null,      -- AES-256-GCM ciphertext (iv:ciphertext:tag, base64)
  token_expires_at timestamptz,
  token_status text not null default 'valid' check (token_status in ('valid','expiring','expired','revoked')),
  page_access_token_encrypted text,   -- FB only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, platform, external_id)
);

-- ── AUTOMATIONS ─────────────────────────────────────────────────────────
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  name text not null,
  trigger_media_id text,              -- NULL = Any post
  trigger_media_caption text,
  keywords text[] not null default '{}', -- case-insensitive; Roman Urdu / Urdu allowed
  match_type match_type not null default 'contains',
  dm_text text not null,
  link text,
  link_button_text text default 'Get the link',
  public_replies text[] not null default '{}', -- up to 3, random pick
  once_per_user boolean not null default true,
  follow_gate_enabled boolean not null default false, -- Pro: first DM asks "reply yes"
  status automation_status not null default 'draft',
  total_triggered int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── EVENTS (raw webhook payload; comment_id unique = dedupe) ────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  platform platform not null,
  comment_id text unique not null,
  sender_id text,
  sender_username text,
  media_id text,
  comment_text text,
  raw_payload jsonb not null,
  received_at timestamptz not null default now()
);
create index if not exists idx_events_comment on public.events(comment_id);
create index if not exists idx_events_workspace on public.events(workspace_id, received_at desc);

-- ── MESSAGE LOGS ────────────────────────────────────────────────────────
create table if not exists public.message_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  automation_id uuid references public.automations(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  comment_id text not null,
  sender_username text,
  status log_status not null default 'queued',
  error text,
  dm_message_id text,
  public_reply_id text,
  retry_count int not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_logs_ws on public.message_logs(workspace_id, created_at desc);
create index if not exists idx_logs_status on public.message_logs(status);

-- ── LEADS ───────────────────────────────────────────────────────────────
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  automation_id uuid references public.automations(id) on delete set null,
  platform platform not null,
  external_user_id text not null,
  username text,
  comment_text text,
  comment_id text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (workspace_id, platform, external_user_id)
);

-- ── USAGE COUNTERS (per workspace per month; backend-enforced) ──────────
create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  month text not null, -- 'YYYY-MM'
  dms_sent int not null default 0,
  comments_matched int not null default 0,
  updated_at timestamptz not null default now(),
  unique (workspace_id, month)
);

-- ── INVOICES / MANUAL PAYMENTS / API KEYS / AUDIT ───────────────────────
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  provider_invoice_id text,
  amount int not null, currency text not null default 'USD',
  status text not null default 'pending', -- paid | pending | failed | refunded
  pdf_url text,
  created_at timestamptz not null default now()
);
create table if not exists public.manual_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan_slug plan_slug not null,
  method text not null check (method in ('jazzcash','easypaisa','bank')),
  amount_pkr int not null,
  sender_name text, sender_number text, transaction_id text,
  screenshot_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default 'Default',
  key_hash text not null, -- SHA-256 of the key; raw key shown once only
  key_prefix text not null, -- e.g. 'rl_live_abc123' first 12 chars for display
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  actor_id uuid references public.profiles(id),
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null, is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── HELPERS: workspace membership check (used by RLS) ───────────────────
create or replace function public.is_workspace_member(ws uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  ) or exists (
    select 1 from public.workspaces w where w.id = ws and w.owner_id = auth.uid()
  );
$$;
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin);
$$;

-- ── RLS: enable on EVERY table ──────────────────────────────────────────
alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.social_accounts enable row level security;
alter table public.automations enable row level security;
alter table public.events enable row level security;
alter table public.message_logs enable row level security;
alter table public.leads enable row level security;
alter table public.usage_counters enable row level security;
alter table public.invoices enable row level security;
alter table public.manual_payments enable row level security;
alter table public.api_keys enable row level security;
alter table public.audit_logs enable row level security;
alter table public.announcements enable row level security;

-- Plans / announcements: public read.
create policy "plans public read" on public.plans for select using (true);
create policy "announcements public read" on public.announcements for select using (is_active = true);
-- Profiles: own row only (+ admins read all).
create policy "profiles own" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin read" on public.profiles for select using (public.is_admin());
-- Workspaces + members: owner or member.
create policy "ws member read" on public.workspaces for select using (public.is_workspace_member(id));
create policy "ws owner write" on public.workspaces for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "members read" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "members owner write" on public.workspace_members for all using (
  exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
-- Everything workspace-scoped: member-only. Service role bypasses RLS (worker / webhooks).
create policy "subs member" on public.subscriptions for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "accounts member" on public.social_accounts for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "automations member" on public.automations for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "events member read" on public.events for select using (workspace_id is null or public.is_workspace_member(workspace_id));
create policy "logs member" on public.message_logs for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "leads member" on public.leads for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "usage member" on public.usage_counters for select using (public.is_workspace_member(workspace_id));
create policy "invoices member" on public.invoices for select using (public.is_workspace_member(workspace_id));
create policy "manual member" on public.manual_payments for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "keys member" on public.api_keys for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "audit member read" on public.audit_logs for select using (workspace_id is null or public.is_workspace_member(workspace_id));
-- Admin overrides.
create policy "admin all manual" on public.manual_payments for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all subs" on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());

-- ── TRIGGER: auto-create profile + workspace + 7-day Pro trial on signup ─
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare ws_id uuid; begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.workspaces (owner_id, name, slug)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','My Workspace') || '''s Workspace',
          'ws-' || substr(replace(new.id::text,'-',''),1,12))
  returning id into ws_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws_id, new.id, 'owner');
  -- 7-day FREE Pro trial, then falls back to Free (enforced in lib/limits.ts)
  insert into public.subscriptions (workspace_id, plan_slug, status, trial_ends_at, current_period_start, current_period_end)
  values (ws_id, 'pro', 'trialing', now() + interval '7 days', now(), now() + interval '7 days');
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
