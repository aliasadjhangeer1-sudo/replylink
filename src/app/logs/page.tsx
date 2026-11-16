"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { formatDate, type MessageLogRow } from "@/lib/workspace";

export default function LogsPage() {
  const { supabase, email, isAdmin, workspace, loading, error } = useAppData();
  const [rows, setRows] = useState<MessageLogRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (loading || !supabase || !workspace) {
      if (!loading) setRowsLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("message_logs")
      .select("id, sender_username, comment_id, status, error, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error: qErr }) => {
        if (cancelled) return;
        if (qErr) setNotice(qErr.message);
        else setRows((data as unknown as MessageLogRow[] | null) ?? []);
        setRowsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, supabase, workspace]);

  if (loading) return <main className="container py-20 text-slate-400">Loading logs...</main>;

  return (
    <AppShell email={email} isAdmin={isAdmin}>
      <p className="text-sm text-violet-300">ACTIVITY LOGS</p>
      <h1 className="mt-2 text-3xl font-black">Message logs</h1>
      <p className="muted mt-2 text-sm">Latest first — every DM ReplyLink sends (or tries to send).</p>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {notice && <p className="mt-4 text-sm text-rose-300">{notice}</p>}

      {rowsLoading ? (
        <p className="muted mt-8">Loading...</p>
      ) : rows.length === 0 ? (
        <div className="card mt-8 p-8">
          <h2 className="text-xl font-bold">No messages yet</h2>
          <p className="muted mt-2 text-sm">
            Once an automation triggers, every DM and public reply is logged here with its status.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((l) => (
            <div key={l.id} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">@{l.sender_username ?? "unknown"}</h2>
                <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">{l.status}</span>
              </div>
              <p className="muted mt-2 text-sm">Comment: {l.comment_id}</p>
              {l.error && <p className="mt-1 text-sm text-rose-300">{l.error}</p>}
              <p className="muted mt-1 text-xs">{formatDate(l.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
