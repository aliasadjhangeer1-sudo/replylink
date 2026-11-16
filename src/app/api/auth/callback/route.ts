import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Server-side PKCE code exchange. The @supabase/ssr browser client stores the
// PKCE code verifier in a cookie, so the SERVER can exchange ?code= even when
// the browser that opens the confirmation link is not the one that started
// the flow (e.g. email opened in a mail app / another browser) — the case
// where a client-side exchange fails with "code verifier not found".
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", req.url));
  }
  const supabase = supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=auth&reason=" + encodeURIComponent(error.message), req.url),
    );
  }
  return NextResponse.redirect(new URL(safeNext, req.url));
}
