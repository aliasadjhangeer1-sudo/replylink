// Shared client hook: loads the logged-in user, their profile and workspace
// once, for all app sub-pages. Redirects to /login when there is no session.
// The browser client is created inside useEffect so SSR prerendering is safe.
"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import {
  getUserWorkspace,
  type BrowserClient,
  type ProfileRow,
  type WorkspaceRow,
} from "@/lib/workspace";

export interface AppData {
  supabase: BrowserClient | null;
  email: string;
  isAdmin: boolean;
  workspace: WorkspaceRow | null;
  loading: boolean;
  error: string;
}

export function useAppData(): AppData {
  const [supabase, setSupabase] = useState<BrowserClient | null>(null);
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let client: BrowserClient;
      try {
        client = createSupabaseBrowserClient();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Missing Supabase environment variables.");
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setSupabase(client);
      try {
        const { data } = await client.auth.getUser();
        if (cancelled) return;
        if (!data.user) {
          location.href = "/login";
          return;
        }
        setEmail(data.user.email || "");
        const { data: profile } = await client
          .from("profiles")
          .select("id, email, full_name, is_admin")
          .eq("id", data.user.id)
          .maybeSingle();
        if (cancelled) return;
        const profileRow = profile as unknown as ProfileRow | null;
        setIsAdmin(profileRow?.is_admin ?? false);
        setWorkspace(await getUserWorkspace(client, data.user.id));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your workspace.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { supabase, email, isAdmin, workspace, loading, error };
}
