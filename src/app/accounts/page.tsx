"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { formatDate, type SocialAccountRow } from "@/lib/workspace";

export default function AccountsPage() {
  const { supabase, email, isAdmin, workspace, loading, error } = useAppData();
  const [rows, setRows] = useState<SocialAccountRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (loading || !supabase || !workspace) {
      if (!loading) setRowsLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("social_accounts")
      .select("id, platform, username, token_status, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .then(({ data, error: qErr }) => {
        if (cancelled) return;
        if (qErr) setNotice(qErr.message);
        else setRows((data as unknown as SocialAccountRow[] | null) ?? []);
        setRowsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, supabase, workspace]);

  if (loading) return <main className="container py-20 text-slate-400">Loading accounts...</main>;

  return (
    <AppShell email={email} isAdmin={isAdmin}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-violet-300">ACCOUNTS</p>
          <h1 className="mt-2 text-3xl font-black">Connected accounts</h1>
          <p className="muted mt-2 text-sm">Instagram and Facebook accounts that ReplyLink can reply from.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() =>
            setNotice("Meta connect (Phase 2) is not enabled yet — automation creation opens after Meta connect.")
          }
        >
          Connect Instagram / Facebook
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {notice && <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">{notice}</p>}

      {rowsLoading ? (
        <p className="muted mt-8">Loading...</p>
      ) : rows.length === 0 ? (
        <div className="card mt-8 p-8">
          <h2 className="text-xl font-bold">No accounts connected yet</h2>
          <p className="muted mt-2 text-sm">
            Connect your Instagram or Facebook account after Meta connect (Phase 2) goes live.
            Your tokens are encrypted and never shared.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((a) => (
            <div key={a.id} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">
                  @{a.username} <span className="muted text-sm font-normal">· {a.platform}</span>
                </h2>
                <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">{a.token_status}</span>
              </div>
              <p className="muted mt-1 text-xs">Connected {formatDate(a.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
