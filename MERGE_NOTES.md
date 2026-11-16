# Merge notes — ZIP base + full Phase 1 spec (2026-11-16)

## Decision log
- Base = uploaded ZIP (`replylink-phase1-complete-code_0_wit7.zip`, 21 files). Reason: runnable, has next.config/tsconfig/postcss/.gitignore, real login/signup/dashboard.
- Full spec = `~/workspace/replylink/` (built earlier in this chat). Reason: complete DB, security, limits, webhook, design system.
- Conflicts resolved in favour of: ZIP for runnable pages/configs, full spec for DB/security/design tokens.

## File-by-file
| File | Source | Note |
|---|---|---|
| package.json | merged | ZIP deps + radix-slot, cva, framer-motion, next-themes, recharts, zod, tailwindcss-animate; version 1.1.0; added `typecheck` |
| src/app/page.tsx, demo.tsx, pricing.tsx, login/, signup/, dashboard/, privacy/, terms/ | ZIP | kept as-is, working |
| src/app/layout.tsx | ZIP | kept (build-safe, no Google Fonts fetch at build); full-spec layout with fonts is in ~/workspace/replylink/src/app/layout.tsx if wanted |
| src/app/globals.css | merged | ZIP .btn/.card/.glass/.container + §5B tokens, scrollbar, reduced-motion |
| tailwind.config.ts | full spec | §5B tokens, glow, float/marquee/fade-up |
| src/lib/supabase.ts | merged | ZIP `createSupabaseBrowserClient()` kept + `supabaseServer()` + `supabaseAdmin()` |
| src/lib/crypto.ts, limits.ts, meta.ts, pricing.ts, utils.ts | full spec | added; crypto `require()` fixed to top-level import |
| src/middleware.ts | full spec | added |
| src/app/api/webhooks/meta/route.ts | full spec | added |
| src/components/ui/button.tsx, theme-provider.tsx | full spec | added |
| supabase/migrations/0002_full_schema.sql | full spec (001_init.sql) | canonical migration, 16 tables + RLS + trial trigger |
| supabase/migrations/archive/0001_initial_schema_STARTER.sql | ZIP | archived, do not run after 0002 on fresh DB |
| .env.example | full spec | all vars documented |
| README.md | rewritten | merged |

## If your DB already ran ZIP 0001
0002 uses `CREATE TABLE IF NOT EXISTS`, so it will NOT add new columns to existing `profiles`/`social_accounts`/`automations`. Run these ALTERs after 0002:
```sql
alter table public.profiles add column if not exists full_name text, add column if not exists avatar_url text, add column if not exists locale text default 'en', add column if not exists is_admin boolean default false, add column if not exists is_banned boolean default false, add column if not exists updated_at timestamptz default now();
alter table public.social_accounts add column if not exists workspace_id uuid, add column if not exists encrypted_token text, add column if not exists token_status text default 'valid';
-- then create workspaces/subscriptions/plans/etc from 0002 (those tables are new, so they are created normally)
-- and re-run the handle_new_user() trigger definition from 0002 (CREATE OR REPLACE).
```
Fresh project: just run 0002.

## Verified
- `npm install` + `npm run typecheck` + `npm run build` — see verification log in this chat turn. Fix list (if any) recorded there.
