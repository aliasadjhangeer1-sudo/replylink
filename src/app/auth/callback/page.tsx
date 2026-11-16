"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";

// Email-confirmation / OAuth landing page. Routes each link style to the
// handler that can actually complete it:
//  - PKCE ?code=... -> hand off to /api/auth/callback (server exchange using
//    the code-verifier cookie). Client-side exchange fails with "code verifier
//    not found" when the link is opened in a different browser/app than the
//    one that started signup — the server route fixes that.
//  - ?token_hash=... -> verifyOtp({ token_hash, type }) in the browser.
//  - #access_token=... (implicit) -> supabase-js auto-detects the hash on getSession().
export default function AuthCallback() {
  const [msg, setMsg] = useState("Confirming your email…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const url = new URL(window.location.href);
        const next = url.searchParams.get("next") || "/dashboard";
        const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
        const code = url.searchParams.get("code");
        if (code) {
          // Full navigation so cookies (incl. the PKCE verifier) are sent.
          window.location.href = `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(safeNext)}`;
          return;
        }
        const s = createSupabaseBrowserClient();
        const tokenHash = url.searchParams.get("token_hash");
        if (tokenHash) {
          const type = (url.searchParams.get("type") as "email" | "recovery" | "invite" | "magiclink" | "email_change") || "email";
          const { error } = await s.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        }
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
