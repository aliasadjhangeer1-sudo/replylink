"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { formatDate, type AutomationRow } from "@/lib/workspace";

export default function AutomationsPage() {
  const { supabase, email, isAdmin, workspace, loading, error } = useAppData();
  const [rows, setRows] = useState<AutomationRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (loading || !supabase || !workspace) {
      if (!loading) setRowsLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("automations")
      .select("id, name, status, keywords, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .then(({ data, error: qErr }) => {
        if (cancelled) return;
        if (qErr) setNotice(qErr.message);
        else setRows((data as unknown as AutomationRow[] | null) ?? []);
        setRowsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, supabase, workspace]);

  if (loading) return <main className="container py-20 text-slate-400">Loading automations...</main>;

  return (
    <AppShell email={email} isAdmin={isAdmin}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-violet-300">AUTOMATIONS</p>
          <h1 className="mt-2 text-3xl font-black">Automations</h1>
          <p className="muted mt-2 text-sm">{workspace ? workspace.name : ""}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() =>
            setNotice("Meta connect (Phase 2) is not enabled yet — automation creation opens after Meta connect.")
          }
        >
          + New automation
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {notice && <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">{notice}</p>}

      {rowsLoading ? (
        <p className="muted mt-8">Loading...</p>
      ) : rows.length === 0 ? (
        <div className="card mt-8 p-8">
          <h2 className="text-xl font-bold">No automations yet</h2>
          <p className="muted mt-2 text-sm">
            Once you connect Instagram or Facebook (Phase 2), your automations will show up here.
            Each automation watches a keyword in comments and sends the DM automatically.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((a) => (
            <div key={a.id} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">{a.name}</h2>
                <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">{a.status}</span>
              </div>
              <p className="muted mt-2 text-sm">
                Keywords: {a.keywords && a.keywords.length > 0 ? a.keywords.join(", ") : "—"}
              </p>
              <p className="muted mt-1 text-xs">Created {formatDate(a.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
