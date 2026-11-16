"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { formatDate, type LeadRow } from "@/lib/workspace";

export default function LeadsPage() {
  const { supabase, email, isAdmin, workspace, loading, error } = useAppData();
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (loading || !supabase || !workspace) {
      if (!loading) setRowsLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("leads")
      .select("id, platform, username, comment_text, first_seen_at")
      .eq("workspace_id", workspace.id)
      .order("first_seen_at", { ascending: false })
      .limit(100)
      .then(({ data, error: qErr }) => {
        if (cancelled) return;
        if (qErr) setNotice(qErr.message);
        else setRows((data as unknown as LeadRow[] | null) ?? []);
        setRowsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, supabase, workspace]);

  if (loading) return <main className="container py-20 text-slate-400">Loading leads...</main>;

  return (
    <AppShell email={email} isAdmin={isAdmin}>
      <p className="text-sm text-violet-300">LEADS</p>
      <h1 className="mt-2 text-3xl font-black">Leads</h1>
      <p className="muted mt-2 text-sm">People who commented your keyword and got a DM.</p>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {notice && <p className="mt-4 text-sm text-rose-300">{notice}</p>}

      {rowsLoading ? (
        <p className="muted mt-8">Loading...</p>
      ) : rows.length === 0 ? (
        <div className="card mt-8 p-8">
          <h2 className="text-xl font-bold">No leads yet</h2>
          <p className="muted mt-2 text-sm">
            Leads appear here automatically once an automation sends its first DM.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((l) => (
            <div key={l.id} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">@{l.username ?? "unknown"}</h2>
                <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">{l.platform}</span>
              </div>
              {l.comment_text && <p className="muted mt-2 text-sm">“{l.comment_text}”</p>}
              <p className="muted mt-1 text-xs">First seen {formatDate(l.first_seen_at)}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
