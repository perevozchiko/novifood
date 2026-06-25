# AI Notes — NoviFood

## Stack

- **Framework**: Next.js 16.2.9 (App Router), React 19
- **Styling**: Tailwind CSS 4 (CSS-first config; `@custom-variant` for dark mode)
- **Database**: Supabase (Postgres) — no auth, single-user app
- **AI**: Gemini 2.0 Flash via REST API (server-only)
- **Deploy target**: Vercel

## Architecture Decisions

- `supabase-browser.ts` vs `supabase-server.ts` — identical clients today, split kept
  intentionally so Server Components can be switched to SSR cookies-based auth later.
- `GEMINI_API_KEY` has no `NEXT_PUBLIC_` prefix — key never reaches browser bundle.
- `maxDuration = 30` on the analyze-food route to stay within Vercel free tier.
- `settings` table enforces `id = 1` constraint — one row, always present.
- Dark mode uses Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *))` +
  `.dark` class on `<html>`. ThemeProvider applies the class, layout.tsx has an
  anti-FOUC inline script.
- Language defaults to `'en'`, stored in `localStorage` under key `lang`.
- E2E tests use the default English locale (no pre-set localStorage).

## Sprint Progress

| Day | Status | Topic |
|-----|--------|-------|
| 1   | ✅ Done | Infrastructure, scaffold, all lib files, build passing |
| 2   | ✅ Done | MacroSummary, AddMealForm, addMeal/deleteMeal live |
| 3   | ✅ Done | CameraUpload, Gemini end-to-end, PortionSelector |
| 4   | ✅ Done | MealCard inline edit, /history calendar |
| 5   | ✅ Done | /weight, /settings, PWA icons |
| 5+  | ✅ Done | Version badge (NEXT_PUBLIC_APP_VERSION + NEXT_PUBLIC_GIT_HASH) |
| 6   | ✅ Done | i18n (EN/RU), dark/light theme, responsive desktop sidebar |

## Day 6 Implementation Notes

### i18n
- `src/lib/i18n.ts` — 75 keys, EN (default) + RU dictionaries
- `src/providers/LanguageProvider.tsx` — `useT()` hook, `useLang()` hook
- All components use `useT()` for every user-visible string
- Dates/numbers use `Intl` with `useLang().locale` (`'en-US'` or `'ru-RU'`)
- Page headings moved from Server Components into Client Components so they can use `useT()`

### Dark / Light Theme
- `src/providers/ThemeProvider.tsx` — toggles `.dark` class on `<html>`
- Anti-FOUC script in `layout.tsx` — reads `localStorage.theme` before hydration
- Tailwind v4: `@custom-variant dark (&:where(.dark, .dark *))` in `globals.css`

### Responsive Layout
- `src/components/AppShell.tsx` — bottom nav on mobile, sidebar on `md+`
- Theme toggle + language toggle in both layouts (sidebar bottom + bottom-nav corner)

## Test Coverage

| File | Tests | Description |
|------|-------|-------------|
| MacroSummary.test.tsx | 5 | Calorie totals, goal display, EN/RU labels |
| MealCard.test.tsx | 6 | Render, delete, edit, cancel |
| AddMealForm.test.tsx | 5 | Open, validate, submit, cancel |
| PortionSelector.test.tsx | 6 | Buttons, highlight, onChange, EN/RU label |
| compress-image.test.ts | 2 | Success path, error path |
| ThemeProvider.test.tsx | 6 | Toggle, dark class, localStorage |
| LanguageProvider.test.tsx | 6 | Lang switch, translate, localStorage, error |
| **Total** | **37** | All passing |

## Version Display

- `NEXT_PUBLIC_APP_VERSION = '0.1.0'` — set manually in `next.config.ts`
- `NEXT_PUBLIC_GIT_HASH` — read from `git rev-parse --short HEAD` at build time
- Displayed as `v0.1.0 (abc1234)` badge in the sidebar (desktop) and bottom nav (mobile)

## Infrastructure Status

- Supabase project: `awdhmtctrlynbdzylrvw` (eu-central-1) — linked via CLI
- Migrations applied: `supabase/migrations/0001_init.sql` ✅
- Tables verified via REST API: `meals` ✅ `settings` ✅ (default row) `weight` ✅
- `.env.local` filled with URL + anon key ⚠️ GEMINI_API_KEY still empty
- `npm run dev` running on http://localhost:3000
