-- 0003_fix_rls_recursion.sql — ReplyLink
-- BUG (found 2026-11-16, live): Billing showed "stack depth limit exceeded" and
-- the dashboard showed "No subscription found" even though the signup trigger
-- creates a Pro trial subscription.
-- ROOT CAUSE: public.is_workspace_member() and public.is_admin() were plain
-- SQL functions. RLS policies on workspaces / workspace_members /
-- subscriptions call them, and the functions themselves query those same
-- tables — so evaluating a policy re-triggered the policy, infinitely
-- (Postgres "stack depth limit exceeded").
-- FIX: make both helpers SECURITY DEFINER (they run as the function owner and
-- bypass RLS while evaluating), with a fixed search_path. This breaks the
-- recursion: policy -> SECURITY DEFINER function -> raw table read, no policy.
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  ) or exists (
    select 1 from public.workspaces w where w.id = ws and w.owner_id = auth.uid()
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin);
$$;
