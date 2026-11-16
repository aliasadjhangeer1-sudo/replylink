"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";

// Email-confirmation landing page. Handles BOTH Supabase link styles:
//  - PKCE: ?code=...  -> exchangeCodeForSession in the browser (verifier is in localStorage)
//  - Implicit: #access_token=... -> supabase-js auto-detects the hash on getSession()
// A server route cannot see the #hash at all, so this must be a client page.
export default function AuthCallback() {
  const [msg, setMsg] = useState("Confirming your email…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const s = createSupabaseBrowserClient();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const next = url.searchParams.get("next") || "/dashboard";
        const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
        if (code) {
          const { error } = await s.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // Hash flow (or a session already set by the exchange): detect + confirm.
        const { data, error } = await s.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error("No session found. The confirmation link may have expired — request a new one from the login page.");
        if (!cancelled) window.location.href = safeNext;
      } catch (err) {
        if (!cancelled) {
          setMsg(err instanceof Error ? err.message : "Confirmation failed.");
          setFailed(true);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container flex min-h-screen items-center justify-center">
      <div className="card w-full max-w-md p-8 text-center">
        <Link href="/" className="text-xl font-black">➤ Reply<span className="text-orange-400">Link</span></Link>
        <h1 className="mt-8 text-2xl font-black">{failed ? "Confirmation failed" : "Confirming your email…"}</h1>
        <p className="muted mt-3 text-sm">{msg}</p>
        {failed && (
          <p className="mt-6 text-sm">
            <Link className="text-violet-300" href="/login">Back to login</Link>
            {" · "}
            <Link className="text-violet-300" href="/signup">Sign up again</Link>
          </p>
        )}
      </div>
    </main>
  );
}
