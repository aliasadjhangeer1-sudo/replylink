"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { PLANS } from "@/lib/pricing";
import { formatDate, type PlanRow, type SubscriptionRow } from "@/lib/workspace";

export default function BillingPage() {
  const { supabase, email, isAdmin, workspace, loading, error } = useAppData();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (loading || !supabase || !workspace) {
      if (!loading) setRowsLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([
      supabase
        .from("plans")
        .select("slug, name, price_usd_cents, price_pkr, max_accounts, max_automations, dm_limit_monthly, features")
        .order("price_pkr", { ascending: true }),
      supabase
        .from("subscriptions")
        .select("workspace_id, plan_slug, status, trial_ends_at, current_period_end")
        .eq("workspace_id", workspace.id)
        .maybeSingle(),
    ]).then(([{ data: planData, error: pErr }, { data: subData, error: sErr }]) => {
      if (cancelled) return;
      if (pErr) setNotice(pErr.message);
      else setPlans((planData as unknown as PlanRow[] | null) ?? []);
      if (sErr) setNotice(sErr.message);
      else setSubscription((subData as unknown as SubscriptionRow | null) ?? null);
      setRowsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loading, supabase, workspace]);

  if (loading) return <main className="container py-20 text-slate-400">Loading billing...</main>;

  const currentPlan = plans.find((p) => p.slug === subscription?.plan_slug);
  const periodEnd = subscription?.trial_ends_at ?? subscription?.current_period_end ?? null;

  return (
    <AppShell email={email} isAdmin={isAdmin}>
      <p className="text-sm text-violet-300">BILLING</p>
      <h1 className="mt-2 text-3xl font-black">Billing</h1>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {notice && <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">{notice}</p>}

      <div className="card mt-8 p-6">
        <p className="muted text-sm">Current plan</p>
        <p className="mt-1 text-2xl font-black">{currentPlan?.name ?? "—"}</p>
        <p className="muted mt-1 text-sm">
          {subscription ? `Status: ${subscription.status}` : "No subscription found"}
          {periodEnd ? ` · ${subscription?.status === "trialing" ? "Trial ends" : "Current period ends"}: ${formatDate(periodEnd)}` : ""}
        </p>
      </div>

      {rowsLoading ? (
        <p className="muted mt-8">Loading plans...</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const display = PLANS.find((x) => x.slug === p.slug);
            const isCurrent = p.slug === subscription?.plan_slug;
            return (
              <div key={p.slug} className="card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{p.name}</h2>
                  {isCurrent && (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">Current plan</span>
                  )}
                </div>
                <p className="mt-3 text-3xl font-black">
                  Rs {display ? display.pkr.toLocaleString() : p.price_pkr.toLocaleString()}
                  <span className="text-base font-normal text-slate-400"> /mo</span>
                </p>
                <p className="muted mt-2 text-sm">
                  {p.max_accounts} account{p.max_accounts === 1 ? "" : "s"} ·{" "}
                  {p.max_automations >= 999999 ? "Unlimited" : p.max_automations} automations ·{" "}
                  {p.dm_limit_monthly.toLocaleString()} DMs / month
                </p>
                <ul className="muted mt-3 space-y-1 text-sm">
                  {p.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                {!isCurrent && (
                  <button
                    className="btn btn-primary mt-6 w-full"
                    onClick={() => setNotice("Payments (Phase 4) are not enabled yet.")}
                  >
                    Upgrade to {p.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="muted mt-6 text-xs">
        Prices in PKR. Yearly billing = 2 months free. Payments via Stripe (USD) and JazzCash / Easypaisa / Safepay (PKR) arrive in Phase 4.
      </p>
    </AppShell>
  );
}
