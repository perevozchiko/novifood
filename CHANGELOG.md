# Changelog

## 2026-06-25 (v1.9 — Fix diary server error)

Fixed:

- Diary page (`/`) crashed with "A server error occurred" on Vercel because `getWaterByDate()` queried the `water_intake` table before migration `0002_water_intake.sql` was applied to the production database. `DiaryDataLoader` now catches the error from that call and falls back to an empty array, so the page loads correctly even with a pending migration.
- Added `src/app/error.tsx` root error boundary: unhandled server-component errors now show a user-friendly "Something went wrong / Что-то пошло не так" card with a Reload button instead of the generic Vercel 500 page.
- Added `error.title`, `error.hint`, `error.reload` i18n keys (EN + RU).

## 2026-06-25 (v1.8 — Bug fixes + Water intake tracking)

Fixed:

- `meal.edit` i18n key in English dictionary was showing Russian text (`'Редактировать'` → `'Edit'`)
- `aria-label` on history navigation buttons hardcoded in Russian — moved to `history.prevDay` / `history.nextDay` i18n keys
- Unit labels (`г`) in `StatsClient` averages and totals were hardcoded Russian — now use `t('settings.g')`
- `offline/page.tsx` had no i18n support — rewritten to use `useT()` with new `offline.*` keys

Added:

- `supabase/migrations/0002_water_intake.sql` — `water_intake` table + `water_goal_ml` column in `settings` (default 2000 ml)
- `src/types/index.ts` — `WaterIntake` type; `water_goal_ml` field in `Settings`
- `src/lib/water-intake.ts` — `getWaterByDate` (server), `addWaterIntake`, `deleteWaterIntake` (client)
- `src/components/WaterTracker.tsx` — daily water intake widget: progress bar, +150/+250/+500 ml quick-add, per-entry delete, goal-reached green indicator
- `src/app/settings/SettingsClient.tsx` — «Daily water goal (ml)» field added to macro goals form
- `__tests__/WaterTracker.test.tsx` — 8 unit tests

## 2026-06-25 (v1.7 — CSV export, history search, PWA offline)

Added:

- `src/lib/export-csv.ts` — client-side CSV export for meals and weight (BOM for Excel, field escaping)
- Settings page: «Data» section with «Export meals (CSV)» and «Export weight (CSV)» buttons
- History page: real-time search bar filters meals by name or notes; clears with ✕ button
- `public/sw.js` — service worker: network-first navigation, cache-first assets, offline fallback
- `src/app/offline/page.tsx` — offline fallback page with «Refresh» button
- `__tests__/export-csv.test.ts` — 10 unit tests for CSV export utilities

## 2026-06-25 (v1.6 — Stats page, quick-add, streak, settings UX)

Added:

- `/stats` page: 7-day SVG calorie bar chart, weekly average КБЖУ, weekly totals, streak badge 🔥
- `getMealsByDateRange`, `getRecentMeals`, `computeStreak`, `getMealDates` utilities in `meals.ts`
- NavLinks: 5th tab 📊 Stats / Статистика
- `AddMealForm`: lazy-loaded recent meal chips — click to fill form from last 5 unique meals
- Home diary: streak badge (🔥 N дней подряд) shown when streak ≥ 2
- `SettingsClient`: "Appearance" section with segmented theme/language toggles and version display
- `__tests__/computeStreak.test.ts` — 8 unit tests for the pure streak function
- `__tests__/StatsClient.test.tsx` — 9 unit tests for the stats component
- `src/lib/i18n.ts` — keys for `stats.*`, `addMeal.recent`, `settings.appearance/*`

Fixed:

- Mobile bottom nav overcrowding: removed ThemeToggle, LangToggle, version badge from nav bar

## 2026-06-25 (v1.5 — Dynamic theme-color + Docs)

Added:

- Dynamic `theme-color` meta tag: `#ffffff` for light theme, `#1f2937` for dark theme
- Meta tag is updated by `ThemeProvider.applyTheme()` on every toggle
- Anti-FOUC inline script extended to also set `theme-color` before first paint (dark mode initial load)
- `docs/plan.md` — sections 15 (Day 7) and 16 (theme-color) added, marked ✅
- `.cursor/TODO.md` — all implemented items marked `[x]`, Day 7 section added

## 2026-06-25 (v1.4 — Day 6: Polish + Performance fix)

Added:

- `src/lib/i18n.ts` — EN/RU translation dictionaries, `translate()`, `formatDate()`, `formatNumber()` utilities
- `src/providers/LanguageProvider.tsx` — React Context for locale, `useT()` hook, `localStorage` persistence
- `src/providers/ThemeProvider.tsx` — dark/light theme toggle via `.dark` class on `<html>`, `useTheme()` hook
- `src/app/ThemeToggle.tsx` — Sun/Moon toggle button (lucide-react)
- `src/app/LangToggle.tsx` — EN/RU toggle button
- `src/app/NavLinks.tsx` — shared navigation links for sidebar and bottom bar variants
- `src/app/TodayDate.tsx` — client component for request-time date display
- `__tests__/test-utils.tsx` — `renderWithProviders` wrapper with LanguageProvider for unit tests
- Skeleton loading states (`animate-pulse`) in `/`, `/history`, `/weight`, `/settings` pages

Fixed:

- Tab switching delay: enabled `cacheComponents: true` (Next.js 16 PPR), wrapped all Supabase fetches in `<Suspense>` with `connection()` — static page shells now render instantly on navigation
- Removed deprecated `export const dynamic = 'force-dynamic'` from all pages

Refactored:

- All components updated with `dark:` Tailwind v4 classes (`@custom-variant dark`)
- All hardcoded UI strings replaced with `useT()` translations
- `layout.tsx` — added ThemeProvider + LanguageProvider, anti-FOUC script, desktop sidebar (`md+`)
- `globals.css` — switched to class-based dark mode (`@custom-variant dark (&:where(.dark,.dark *))`)
- `HistoryClient` — today's date computed client-side (no server prop needed)

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
