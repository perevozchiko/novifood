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
| 6   | ✅ Done | i18n (EN/RU), dark/light theme, responsive desktop sidebar |
| Perf| ✅ Done | cacheComponents (PPR), Suspense streaming, instant tab nav |
| 7   | ✅ Done | MacroSummary in history, notes field, weight delete, more tests |

## Performance Fix (2026-06-25)

Root cause of tab switching delay: every page navigation triggered a full
server-side Supabase fetch via `force-dynamic`.

Fix:
- `cacheComponents: true` in next.config.ts enables Next.js 16 PPR
- Each page now has a static prerendered shell (h1, nav) + dynamic Suspense boundary
- `connection()` from `next/server` defers Supabase calls to request time
- React Activity (Cache Components) preserves up to 3 route states in memory
- Skeleton loaders (`animate-pulse`) provide immediate visual feedback

## i18n (2026-06-25)

- Two locales: `en` (default for new users), `ru` (default for existing Russian UI)
- Default: `ru` (preserves existing user experience)
- Storage key: `lang` in localStorage
- Dictionaries: `src/lib/i18n.ts` — all UI strings covered
- Hook: `useT()` from `src/providers/LanguageProvider.tsx`

## Dark Theme (2026-06-25)

- Tailwind v4 class strategy: `@custom-variant dark (&:where(.dark, .dark *))`
- Toggle: `.dark` class on `<html>`, localStorage key `theme`
- Anti-FOUC: inline `<script>` in `<head>` reads localStorage before first paint
- Respects OS `prefers-color-scheme` as initial default

## Day 7 Features (2026-06-25)

- `MacroSummary` added to `/history` for the selected day (settings fetched server-side via `HistoryContent` async component)
- Optional `notes` field added to `AddMealForm` and `MealCard` (stored in `meals.notes`, shown as italic caption)
- `deleteWeight(id)` added to `weight.ts`; delete button in `/weight` history list
- New unit tests: `SettingsClient.test.tsx` (8), `WeightClient.test.tsx` (7)

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
