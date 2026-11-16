// Shared row types + workspace lookup for the app (client) pages.
// Every query here is written to pass the RLS policies in
// supabase/migrations/0002_full_schema.sql for a logged-in workspace member:
// profiles = own row only; workspaces/subscriptions/automations/leads/logs/
// accounts/usage = workspace member (owner counts as member via is_workspace_member);
// plans = public read.
import type { createSupabaseBrowserClient } from "@/lib/supabase";

export type BrowserClient = ReturnType<typeof createSupabaseBrowserClient>;

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
}

export interface WorkspaceRow {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
}

export interface PlanRow {
  slug: string;
  name: string;
  price_usd_cents: number;
  price_pkr: number;
  max_accounts: number;
  max_automations: number;
  dm_limit_monthly: number;
  features: string[];
}

export interface SubscriptionRow {
  workspace_id: string;
  plan_slug: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export interface AutomationRow {
  id: string;
  name: string;
  status: string;
  keywords: string[];
  created_at: string;
}

export interface SocialAccountRow {
  id: string;
  platform: string;
  username: string;
  token_status: string;
  created_at: string;
}

export interface LeadRow {
  id: string;
  platform: string;
  username: string | null;
  comment_text: string | null;
  first_seen_at: string;
}

export interface MessageLogRow {
  id: string;
  sender_username: string | null;
  comment_id: string;
  status: string;
  error: string | null;
  created_at: string;
}

/** "YYYY-MM" for the current month (UTC). Usage counters are keyed by it. */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The workspace owned by this user (the signup trigger creates exactly one).
 * Falls back to a workspace the user is a member of, for Agency invites.
 * Returns null when the user has no workspace yet (e.g. trigger still pending).
 */
export async function getUserWorkspace(supabase: BrowserClient, userId: string): Promise<WorkspaceRow | null> {
  const { data: owned } = await supabase
    .from("workspaces")
    .select("id, owner_id, name, slug")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (owned) return owned as unknown as WorkspaceRow;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  const membershipRow = membership as unknown as { workspace_id: string } | null;
  if (!membershipRow) return null;
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, owner_id, name, slug")
    .eq("id", membershipRow.workspace_id)
    .maybeSingle();
  return (ws as unknown as WorkspaceRow | null) ?? null;
}

/** Count rows in a workspace-scoped table (RLS: member-only, head query). */
export async function countRows(
  supabase: BrowserClient,
  table: string,
  workspaceId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return count ?? 0;
}
