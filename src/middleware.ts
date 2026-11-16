import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Protects /dashboard, /automations, /accounts, /logs, /leads, /billing, /settings, /admin.
// Public: /, /pricing, /features, /login, /signup, /privacy, /terms, /data-deletion, /api/webhooks/*
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // Dev without .env.local: Supabase keys are missing — do not crash public pages.
  // Auth gating resumes as soon as NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return res;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get: (n: string) => req.cookies.get(n)?.value, set: (n: string, v: string, o: any) => res.cookies.set({ name: n, value: v, ...o }), remove: (n: string, o: any) => res.cookies.set({ name: n, value: "", ...o }) },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const isApp = path.startsWith("/dashboard") || path.startsWith("/automations") || path.startsWith("/accounts") || path.startsWith("/logs") || path.startsWith("/leads") || path.startsWith("/billing") || path.startsWith("/settings") || path.startsWith("/admin");
  if (isApp && !user) return NextResponse.redirect(new URL("/login?next=" + encodeURIComponent(path), req.url));
  if ((path === "/login" || path === "/signup") && user) return NextResponse.redirect(new URL("/dashboard", req.url));
  // Admin gate (also enforced by RLS + server check in the page): non-admins get bounced.
  if (path.startsWith("/admin") && user) {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return res;
}
export const config = { matcher: ["/dashboard/:path*", "/automations/:path*", "/accounts/:path*", "/logs/:path*", "/leads/:path*", "/billing/:path*", "/settings/:path*", "/admin/:path*", "/login", "/signup"] };
