"use client";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import GoogleSignInButton from "@/components/google-signin-button";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(params.get("error") === "auth" ? "Confirmation link failed or expired. Try logging in, or resend the confirmation email below." : "");
  const [msgOk, setMsgOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setMsgOk(false);
    try {
      const s = createSupabaseBrowserClient();
      const { error } = await s.auth.signInWithPassword({ email, password });
      if (error) throw error;
      location.href = "/dashboard";
    } catch (err) {
      const m = err instanceof Error ? err.message : "Login failed";
      setMsg(m.toLowerCase().includes("confirm") ? m + " — check your inbox for the confirmation email, or resend it below." : m);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email) {
      setMsg("Enter your email above first, then resend.");
      setMsgOk(false);
      return;
    }
    setResending(true);
    setMsg("");
    try {
      const s = createSupabaseBrowserClient();
      const { error } = await s.auth.resend({ type: "signup", email, options: { emailRedirectTo: location.origin + "/auth/callback?next=/dashboard" } });
      if (error) throw error;
      setMsg("Confirmation email resent. Check your inbox (and spam folder).");
      setMsgOk(true);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not resend the email.");
      setMsgOk(false);
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="container flex min-h-screen items-center justify-center">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <Link href="/" className="text-xl font-black">➤ Reply<span className="text-orange-400">Link</span></Link>
        <h1 className="mt-8 text-3xl font-black">Welcome back</h1>
        <p className="muted mt-2">Sign in to your workspace.</p>
        <label className="mt-6 block text-sm">Email</label>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" />
        <label className="mt-4 block text-sm">Password</label>
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3" />
        <button disabled={busy} className="btn btn-primary mt-6 w-full">{busy ? "Signing in..." : "Login"}</button>
        <div className="mt-5 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
        <GoogleSignInButton label="Continue with Google" />
        {msg && <p className={`mt-3 text-sm ${msgOk ? "text-emerald-300" : "text-rose-300"}`}>{msg}</p>}
        <button type="button" onClick={resend} disabled={resending} className="mt-4 w-full text-sm text-violet-300 underline-offset-2 hover:underline">
          {resending ? "Sending..." : "Resend confirmation email"}
        </button>
        <p className="muted mt-5 text-sm">New here? <Link className="text-violet-300" href="/signup">Create an account</Link></p>
      </form>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<main className="container py-20 text-slate-400">Loading...</main>}>
      <LoginForm />
    </Suspense>
  );
}
