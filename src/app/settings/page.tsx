"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import { useAppData } from "@/lib/use-app-data";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { ProfileRow } from "@/lib/workspace";

export default function SettingsPage() {
  const { supabase, email, isAdmin, workspace, loading, error } = useAppData();
  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (loading || !supabase) return;
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      setUserId(data.user.id);
      supabase
        .from("profiles")
        .select("id, email, full_name, is_admin")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (cancelled) return;
          const row = profile as unknown as ProfileRow | null;
          if (row?.full_name) setFullName(row.full_name);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [loading, supabase]);

  useEffect(() => {
    if (workspace) setWorkspaceName(workspace.name);
  }, [workspace]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !userId || !workspace) return;
    setBusy(true);
    setMsg("");
    try {
      // RLS: profiles "own" policy allows updating your own row;
      // workspaces "owner write" allows the owner to update the workspace.
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);
      if (pErr) throw pErr;
      const { error: wErr } = await supabase
        .from("workspaces")
        .update({ name: workspaceName })
        .eq("id", workspace.id);
      if (wErr) throw wErr;
      setMsg("Saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    const s = createSupabaseBrowserClient();
    await s.auth.signOut();
    location.href = "/";
  }

  if (loading) return <main className="container py-20 text-slate-400">Loading settings...</main>;

  return (
    <AppShell email={email} isAdmin={isAdmin}>
      <p className="text-sm text-violet-300">SETTINGS</p>
      <h1 className="mt-2 text-3xl font-black">Settings</h1>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      <form onSubmit={save} className="card mt-8 max-w-lg p-8">
        <label className="block text-sm">Email</label>
        <input disabled value={email} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-slate-400" />
        <p className="muted mt-1 text-xs">Email cannot be changed here.</p>

        <label className="mt-6 block text-sm">Full name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3"
        />

        <label className="mt-6 block text-sm">Workspace name</label>
        <input
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3"
        />

        <button disabled={busy} className="btn btn-primary mt-6 w-full">
          {busy ? "Saving..." : "Save settings"}
        </button>
        {msg && <p className="mt-3 text-sm text-emerald-300">{msg}</p>}
      </form>

      <button onClick={logout} className="btn btn-secondary mt-6">
        Logout
      </button>
    </AppShell>
  );
}
