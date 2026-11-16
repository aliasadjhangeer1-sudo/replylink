// Server-only Supabase clients — NEVER import this file from a client component.
// Split out because src/lib/supabase.ts is imported by login/signup/dashboard (client)
// and next/headers cannot be bundled there (build error fixed 2026-11-16).
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const supabaseServer = () => {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (n: string) => store.get(n)?.value,
      set: (n: string, v: string, o: any) => store.set({ name: n, value: v, ...o }),
      remove: (n: string, o: any) => store.set({ name: n, value: "", ...o }),
    },
  });
};
// Service-role: ONLY server-side. Bypasses RLS — never expose to client.
export const supabaseAdmin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
