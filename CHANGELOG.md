# Changelog

## 2026-06-24

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
