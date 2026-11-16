"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Plus } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import AppShell from "@/components/app-shell";
import {
  countRows,
  currentMonth,
  formatDate,
  getUserWorkspace,
  type PlanRow,
  type ProfileRow,
  type SubscriptionRow,
  type WorkspaceRow,
} from "@/lib/workspace";

function limitLabel(value: number): string {
  return value >= 999999 ? "Unlimited" : String(value);
}

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState<WorkspaceRow | null>(null);
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [automationCount, setAutomationCount] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [dmsThisMonth, setDmsThisMonth] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const s = createSupabaseBrowserClient();
        const { data } = await s.auth.getUser();
        if (!data.user) {
          location.href = "/login";
          return;
        }
        setEmail(data.user.email || "");

        const { data: profile } = await s
          .from("profiles")
          .select("id, email, full_name, is_admin")
          .eq("id", data.user.id)
          .maybeSingle();
        const profileRow = profile as unknown as ProfileRow | null;
        setIsAdmin(profileRow?.is_admin ?? false);

        const ws = await getUserWorkspace(s, data.user.id);
        setWorkspace(ws);
        if (!ws) {
          setLoading(false);
          return;
        }

        const [{ data: sub }, { data: planRows }] = await Promise.all([
          s
            .from("subscriptions")
            .select("workspace_id, plan_slug, status, trial_ends_at, current_period_end")
            .eq("workspace_id", ws.id)
            .maybeSingle(),
          s.from("plans").select("slug, name, price_usd_cents, price_pkr, max_accounts, max_automations, dm_limit_monthly, features"),
        ]);
        const subRow = sub as unknown as SubscriptionRow | null;
        setSubscription(subRow);
        const plans = (planRows as unknown as PlanRow[] | null) ?? [];
        setPlan(plans.find((p) => p.slug === subRow?.plan_slug) ?? plans.find((p) => p.slug === "free") ?? null);

        const month = currentMonth();
        const [autos, accounts, leads, usage] = await Promise.all([
          countRows(s, "automations", ws.id),
          countRows(s, "social_accounts", ws.id),
          countRows(s, "leads", ws.id),
          s.from("usage_counters").select("dms_sent").eq("workspace_id", ws.id).eq("month", month).maybeSingle(),
        ]);
        setAutomationCount(autos);
        setAccountCount(accounts);
        setLeadCount(leads);
        const usageRow = usage.data as unknown as { dms_sent: number } | null;
        if (usageRow) {
          setDmsThisMonth(usageRow.dms_sent);
        } else {
          // No counter row yet this month: fall back to counting sent logs.
          const monthStart = new Date(`${month}-01T00:00:00Z`).toISOString();
          const { count } = await s
            .from("message_logs")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", ws.id)
            .eq("status", "sent")
            .gte("created_at", monthStart);
          setDmsThisMonth(count ?? 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load your workspace.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="container py-20 text-slate-400">Loading workspace...</main>
    );
  }

  const planName = plan?.name ?? "Free";
  const periodEnd = subscription?.trial_ends_at ?? subscription?.current_period_end ?? null;
  const periodLabel =
    subscription?.status === "trialing" ? "Trial ends" : "Current period ends";

  return (
    <AppShell email={email} isAdmin={isAdmin}>
      <p className="text-sm text-violet-300">WORKSPACE OVERVIEW</p>
      <h1 className="mt-2 text-4xl font-black">Welcome to ReplyLink</h1>
      <p className="muted mt-2">
        {workspace ? workspace.name : "Your automation workspace is ready to configure."}
      </p>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <p className="muted text-sm">Automations</p>
          <p className="mt-3 text-3xl font-black">
            {automationCount} / {plan ? limitLabel(plan.max_automations) : "—"}
          </p>
        </div>
        <div className="card p-6">
          <p className="muted text-sm">DMs this month</p>
          <p className="mt-3 text-3xl font-black">
            {dmsThisMonth} / {plan ? plan.dm_limit_monthly.toLocaleString() : "—"}
          </p>
        </div>
        <div className="card p-6">
          <p className="muted text-sm">Connected accounts</p>
          <p className="mt-3 text-3xl font-black">
            {accountCount} / {plan ? plan.max_accounts : "—"}
          </p>
          <p className="muted mt-2 text-sm">{leadCount} leads collected</p>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="muted text-sm">Current plan</p>
            <p className="mt-1 text-2xl font-black">{planName}</p>
            <p className="muted mt-1 text-sm">
              {subscription ? `Status: ${subscription.status}` : "No subscription found"}
              {periodEnd ? ` · ${periodLabel}: ${formatDate(periodEnd)}` : ""}
            </p>
          </div>
          <Link href="/billing" className="btn btn-secondary">
            Upgrade
          </Link>
        </div>
      </div>

      {automationCount === 0 && (
        <div className="card mt-6 p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-3 text-violet-300">
              <Bot />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create your first automation</h2>
              <p className="muted mt-1 text-sm">
                Connect an eligible Meta account, then choose your trigger keyword.
              </p>
            </div>
          </div>
          <Link href="/automations" className="btn btn-primary mt-6">
            <Plus size={17} /> New automation
          </Link>
          <p className="muted mt-3 text-xs">
            Automation creation and Meta messaging open after Meta connect (Phase 2).
          </p>
        </div>
      )}
    </AppShell>
  );
}
