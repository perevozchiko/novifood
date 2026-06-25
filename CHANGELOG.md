# Changelog

## 2026-06-25 (v1.3 — Version display)

Added:

- `next.config.ts` — build-time injection of `NEXT_PUBLIC_APP_VERSION` (`0.1.0`) and `NEXT_PUBLIC_GIT_HASH` (short git commit hash via `execSync`)
- `src/app/layout.tsx` — subtle version badge `v0.1.0 (abc1234)` in bottom navigation bar, absolutely positioned, does not affect nav height

Refactored:

- `docs/plan.md` — updated to v1.3; added section 12 (version display) and section 13 (Day 6 sprint: i18n, dark/light theme, responsive layout) with completion markers

## 2026-06-24 (v1.2 — Days 2–5 + Testing)

Added:

- `src/components/MacroSummary.tsx` — calorie progress ring + protein/fat/carb bars
- `src/components/MealCard.tsx` — meal display card with inline editing and delete
- `src/components/AddMealForm.tsx` — manual food entry form with validation
- `src/components/CameraUpload.tsx` — camera capture → compress → Gemini → diary
- `src/components/PortionSelector.tsx` — portion multiplier buttons (0.5x–2x)
- `src/app/DiaryClient.tsx` — client-side state manager for the home diary
- `src/app/history/HistoryClient.tsx` — day-navigation calendar with edit/delete
- `src/app/weight/WeightClient.tsx` — weight input form + sparkline SVG chart
- `src/app/settings/SettingsClient.tsx` — editable macro goal form
- `public/icons/icon-192.png`, `icon-512.png` — PWA icons
- Vitest unit tests: `MacroSummary`, `MealCard`, `AddMealForm`, `PortionSelector`, `compress-image`
- Playwright E2E tests: navigation smoke suite + diary interaction suite
- `vitest.config.mts` — Vitest configuration with jsdom environment
- `playwright.config.ts` — Playwright configuration with `webServer` (next dev)
- `npm test`, `npm run test:watch`, `npm run test:e2e` scripts

Refactored:

- `src/app/page.tsx` — upgraded from placeholder stub to real Server Component fetching data
- `src/app/history/page.tsx` — upgraded from stub to real page
- `src/app/weight/page.tsx` — upgraded from stub to real Server Component
- `src/app/settings/page.tsx` — upgraded from stub to real Server Component
- `docs/plan.md` — rewritten as v1.2 with ✅ completion markers and full testing section

## 2026-06-24 (v1.1 — Day 1)

Added:

- Next.js 16 (App Router) + TypeScript + Tailwind CSS project scaffold
- Supabase client setup: `src/lib/supabase-browser.ts` and `src/lib/supabase-server.ts`
- Type definitions: `Meal`, `Settings`, `Weight`, `FoodAnalysis` in `src/types/index.ts`
- Data layer: `meals.ts`, `settings.ts`, `weight.ts` with full CRUD via Supabase
- Gemini 2.0 Flash integration: `src/lib/gemini.ts` (server-only)
- Client-side image compression utility: `src/lib/compress-image.ts`
- Protected API route: `POST /api/analyze-food`
- PWA manifest: `src/app/manifest.ts`
- Base layout with bottom navigation (Diary / History / Weight / Goals)
- Page stubs: `/`, `/history`, `/weight`, `/settings`
- `.env.local.example` with all required environment variable keys
- Build passes with zero TypeScript errors (Next.js 16.2.9)
- Supabase migrations: `supabase/migrations/0001_init.sql` — tables meals, settings, weight
- Migration applied to remote project `awdhmtctrlynbdzylrvw` via `supabase db push`
- `.env.local` configured with Supabase URL and anon key
