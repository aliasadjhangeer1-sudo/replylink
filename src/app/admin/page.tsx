import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase-server";

interface AdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

interface AdminPlan {
  slug: string;
  name: string;
  price_pkr: number;
  max_accounts: number;
  max_automations: number;
  dm_limit_monthly: number;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPage() {
  // Step 1: who is logged in? (cookie session, RLS: profiles "own" row.)
  const server = supabaseServer();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) redirect("/dashboard");

  const { data: profile } = await server
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  const profileRow = profile as unknown as { is_admin: boolean } | null;
  if (!profileRow?.is_admin) redirect("/dashboard");

  // Step 2: real stats via the service-role client (bypasses RLS, server-only).
  const admin = supabaseAdmin();
  const monthStart = new Date(new Date().toISOString().slice(0, 7) + "-01T00:00:00Z").toISOString();

  const [{ count: totalUsers }, { count: totalWorkspaces }, { count: activeSubs }, { count: dmsThisMonth }] =
    await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("workspaces").select("id", { count: "exact", head: true }),
      admin
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .in("status", ["trialing", "active"]),
      admin
        .from("message_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("created_at", monthStart),
    ]);

  const [{ data: users }, { data: plans }, { data: subs }, { data: workspaces }] = await Promise.all([
    admin.from("profiles").select("id, email, full_name, is_admin, is_banned, created_at").order("created_at", { ascending: false }).limit(100),
    admin.from("plans").select("slug, name, price_pkr, max_accounts, max_automations, dm_limit_monthly").order("price_pkr", { ascending: true }),
    admin.from("subscriptions").select("workspace_id, plan_slug, status"),
    admin.from("workspaces").select("id, owner_id"),
  ]);

  const userRows = (users as unknown as AdminProfile[] | null) ?? [];
  const planRows = (plans as unknown as AdminPlan[] | null) ?? [];
  const planName = new Map(planRows.map((p) => [p.slug, p.name]));
  // subscriptions are per workspace; workspaces map workspace -> owner (user).
  const ownerByWorkspace = new Map(
    ((workspaces as unknown as { id: string; owner_id: string }[] | null) ?? []).map((w) => [w.id, w.owner_id]),
  );
  const planByUser = new Map<string, string>();
  for (const s of ((subs as unknown as { workspace_id: string; plan_slug: string }[] | null) ?? [])) {
    const owner = ownerByWorkspace.get(s.workspace_id);
    if (owner) planByUser.set(owner, planName.get(s.plan_slug) ?? s.plan_slug);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="container flex items-center justify-between py-5">
          <Link href="/" className="text-xl font-black">
            ➤ Reply<span className="text-orange-400">Link</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-violet-300">
            ← Back to dashboard
          </Link>
        </div>
      </header>
      <div className="container py-10">
        <p className="text-sm text-violet-300">ADMIN PANEL</p>
        <h1 className="mt-2 text-4xl font-black">Admin</h1>
        <p className="muted mt-2 text-sm">Read-only overview. User management actions (ban / make admin / change plan) come next.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Total users", totalUsers ?? 0],
            ["Total workspaces", totalWorkspaces ?? 0],
            ["Active subscriptions", activeSubs ?? 0],
            ["DMs sent this month", dmsThisMonth ?? 0],
          ].map(([label, value]) => (
            <div className="card p-6" key={label as string}>
              <p className="muted text-sm">{label as string}</p>
              <p className="mt-3 text-3xl font-black">{value as number}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-2xl font-bold">Users</h2>
        {userRows.length === 0 ? (
          <p className="muted mt-4">No users yet.</p>
        ) : (
          <div className="card mt-4 overflow-x-auto p-2">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="muted">
                  <th className="p-3">Email</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Banned</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {userRows.map((u) => (
                  <tr key={u.id} className="border-t border-white/5">
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.full_name || "—"}</td>
                    <td className="p-3">{planByUser.get(u.id) ?? "—"}</td>
                    <td className="p-3">{u.is_admin ? "Yes" : "No"}</td>
                    <td className="p-3">{u.is_banned ? "Yes" : "No"}</td>
                    <td className="p-3">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mt-10 text-2xl font-bold">Plans</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {planRows.map((p) => (
            <div key={p.slug} className="card p-6">
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="mt-2 text-2xl font-black">
                Rs {p.price_pkr.toLocaleString()}
                <span className="text-base font-normal text-slate-400"> /mo</span>
              </p>
              <p className="muted mt-2 text-sm">
                {p.max_accounts} account{p.max_accounts === 1 ? "" : "s"} ·{" "}
                {p.max_automations >= 999999 ? "Unlimited" : p.max_automations} automations ·{" "}
                {p.dm_limit_monthly.toLocaleString()} DMs / month
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
