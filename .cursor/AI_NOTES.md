# AI Notes — NoviFood

## Stack

- **Framework**: Next.js 16.2.9 (App Router), React 19
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (Postgres) — no auth, single-user app
- **AI**: Gemini 2.0 Flash via REST API (server-only)
- **Deploy target**: Vercel

## Architecture Decisions

- `supabase-browser.ts` vs `supabase-server.ts` — identical clients today, split kept
  intentionally so Server Components can be switched to SSR cookies-based auth later.
- `GEMINI_API_KEY` has no `NEXT_PUBLIC_` prefix — key never reaches browser bundle.
- `maxDuration = 30` on the analyze-food route to stay within Vercel free tier.
- `settings` table enforces `id = 1` constraint — one row, always present.

## Sprint Progress

| Day | Status | Topic |
|-----|--------|-------|
| 1   | ✅ Done | Infrastructure, scaffold, all lib files, build passing |
| 2   | ✅ Done | MacroSummary, AddMealForm, addMeal/deleteMeal live |
| 3   | ✅ Done | CameraUpload, Gemini end-to-end, PortionSelector |
| 4   | ✅ Done | MealCard inline edit, /history calendar |
| 5   | ✅ Done | /weight, /settings, PWA icons |
| 6   | 🔲 Next | i18n (EN/RU), dark/light theme, responsive desktop sidebar |

## Version Display

- `NEXT_PUBLIC_APP_VERSION = '0.1.0'` — set manually in `next.config.ts`
- `NEXT_PUBLIC_GIT_HASH` — read from `git rev-parse --short HEAD` at build time
- Displayed as `v0.1.0 (abc1234)` badge in the bottom nav bar

## Infrastructure Status

- Supabase project: `awdhmtctrlynbdzylrvw` (eu-central-1) — linked via CLI
- Migrations applied: `supabase/migrations/0001_init.sql` ✅
- Tables verified via REST API: `meals` ✅ `settings` ✅ (default row) `weight` ✅
- `.env.local` filled with URL + anon key ⚠️ GEMINI_API_KEY still empty
- `npm run dev` running on http://localhost:3000

## Before Starting Day 2

1. ✅ Supabase project created and migrations applied
2. ✅ `.env.local` filled (add GEMINI_API_KEY from https://aistudio.google.com/apikey)
3. Deploy to Vercel: connect the repo and set env vars in Vercel dashboard.
