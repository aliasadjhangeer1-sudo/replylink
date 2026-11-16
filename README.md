# ReplyLink — Phase 1 MERGED (v1.1.0)

**Base:** your uploaded ZIP (runnable Next.js 14 starter) + **full Phase 1 spec** from `~/workspace/replylink/`.
Run it the same way as the ZIP — `npm install && npm run dev` — now with the complete backend spec merged in.

## What came from the ZIP (kept as-is)
- Runnable scaffold: `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `.gitignore`, `next-env.d.ts`
- Landing page `src/app/page.tsx`, `Demo` + `Pricing` components, login/signup/dashboard shell (real Supabase Auth)
- Privacy / Terms draft pages, SEO metadata

## What was merged in from the full spec
- **DB:** `supabase/migrations/0002_full_schema.sql` — 16 tables (profiles, workspaces, members, plans, subscriptions, social_accounts, automations, events, message_logs, leads, usage_counters, invoices, manual_payments, api_keys, audit_logs, announcements), RLS on every table, 4 plans seeded, signup trigger auto-creates profile + workspace + **7-day Pro trial**. ZIP's original SQL kept at `supabase/migrations/archive/0001_initial_schema_STARTER.sql` — do NOT run both blindly; run **0002 only** on a fresh project (it is self-contained, `IF NOT EXISTS`). On an existing DB that already ran 0001, run 0002 and then check `profiles` has the extra columns — 0002's `CREATE TABLE IF NOT EXISTS` will not add columns to an existing table; in that case run the ALTERs in `MERGE_NOTES.md`.
- **Auth hardening:** `src/middleware.ts` — protects /dashboard, /automations, /accounts, /logs, /leads, /billing, /settings, /admin; /admin also requires `profiles.is_admin`.
- **Security libs:** `src/lib/crypto.ts` (AES-256-GCM token encryption, SHA-256 API-key hash), `src/lib/limits.ts` (backend DM-limit enforcement, 80% warn / 100% block, trial + 3-day grace logic), `src/lib/meta.ts` (Graph v21.0, long-lived token exchange, private-reply helpers), `src/lib/pricing.ts` (yearly = 2 months free), `src/lib/utils.ts`.
- **Webhook stub:** `src/app/api/webhooks/meta/route.ts` — GET verify + POST `X-Hub-Signature-256` timing-safe check, 200 ack.
- **Design system:** `tailwind.config.ts` (§5B tokens: #0A0B14, violet→pink→orange), merged `globals.css` (zip .btn/.card/.glass kept + tokens), `src/components/ui/button.tsx`, `src/components/theme-provider.tsx`.
- **Env:** `.env.example` now documents ALL vars (Supabase, Meta, QStash, Stripe, Safepay/PayFast, manual JazzCash/Easypaisa).

## Run locally
1. `npm install`
2. `cp .env.example .env.local` — fill Supabase URL + anon key (minimum to run; service-role + Meta keys needed for Phase 2).
3. Supabase SQL Editor → run `supabase/migrations/0002_full_schema.sql`.
4. Supabase Auth → enable Email + Google, Site URL `http://localhost:3000/**`.
5. `npm run dev` → http://localhost:3000
6. Verify: `npm run typecheck` and `npm run build`

## Pricing (UI + DB agree)
Free $0/Rs 0 (1 acc, 3 automations, 100 DMs) · Starter $1/Rs 150 (500 DMs) · Pro $19/Rs 5,499 (3 acc, unlimited, 10,000 DMs) · Agency $49/Rs 13,999 (10 acc, 50,000 DMs). Yearly = pay 10× monthly.

## Production gaps — do not skip (from ZIP README, still true)
Phase 1 is NOT live Meta automation. Still needed: Meta app + approved permissions, OAuth flow, webhook subscription, queue/worker with idempotency/retries, plan/billing enforcement in Phase 4, payment webhooks. Dashboard automation button stays disabled until Phase 2.

## Next phases
Phase 2: Meta OAuth + webhooks + queue + engine. Phase 3: builder + logs + leads. Phase 4: billing/trial/limits. Phase 5: admin/compliance.
See `MERGE_NOTES.md` for the full file-by-file merge map.
