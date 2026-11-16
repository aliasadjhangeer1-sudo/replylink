// Plan limits — ENFORCED IN BACKEND (worker + API), never only in UI.
// Usage: const check = await canSendDM(supabase, workspaceId); if (!check.ok) return { blocked: true, reason: check.reason }
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanSlug = "free" | "starter" | "pro" | "agency";
export const PLANS: Record<PlanSlug, { maxAccounts: number; maxAutomations: number; dmLimit: number }> = {
  free: { maxAccounts: 1, maxAutomations: 3, dmLimit: 100 },
  starter: { maxAccounts: 1, maxAutomations: 5, dmLimit: 500 }, // Rs 150/mo — micro-seller tier
  pro: { maxAccounts: 3, maxAutomations: Infinity, dmLimit: 10000 },
  agency: { maxAccounts: 10, maxAutomations: Infinity, dmLimit: 50000 },
};
export function monthKey(d = new Date()): string { return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; }
export function effectivePlan(sub: { plan_slug: PlanSlug; status: string; trial_ends_at: string | null }): PlanSlug {
  if (sub.status === "trialing" && sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date()) return "pro";
  if (sub.status === "grace") return sub.plan_slug; // 3-day grace keeps paid limits
  if (sub.status === "active" || sub.status === "trialing") return sub.plan_slug;
  return "free"; // past_due after grace, canceled, free → Free
}
export async function canSendDM(db: SupabaseClient, workspaceId: string): Promise<{ ok: boolean; reason?: string; used?: number; limit?: number }> {
  const { data: sub } = await db.from("subscriptions").select("plan_slug,status,trial_ends_at").eq("workspace_id", workspaceId).single();
  if (!sub) return { ok: false, reason: "No subscription found" };
  const plan = effectivePlan(sub as any);
  const limit = PLANS[plan].dmLimit;
  const { data: usage } = await db.from("usage_counters").select("dms_sent").eq("workspace_id", workspaceId).eq("month", monthKey()).single();
  const used = usage?.dms_sent ?? 0;
  if (used >= limit) return { ok: false, reason: `Monthly DM limit reached (${used}/${limit}). Upgrade to keep sending.`, used, limit };
  return { ok: true, used, limit };
}
export function usagePct(used: number, limit: number): number { return Math.min(100, Math.round((used / limit) * 100)); }
export function warnAt80(used: number, limit: number): boolean { return usagePct(used, limit) >= 80; }
