# Architecture Decisions — NoviFood

## 2026-06-24

### Single Supabase client pattern (no RLS)
App is single-user. No Row Level Security configured.
If multi-user support is added in the future, both Supabase clients must be replaced
with cookie-based `@supabase/ssr` clients that carry the session token.

### No state management library
React built-in state + Server Components data fetching is sufficient for this scope.
TanStack Query may be added in Day 2 if optimistic updates become complex.

### Image analysis via API route, not direct client fetch
Gemini API key must stay on the server. All image analysis goes through
`POST /api/analyze-food` which runs in a Vercel serverless function.

### Tailwind CSS 4 (not v3)
`create-next-app` scaffolded with Tailwind 4 and `@tailwindcss/postcss`.
No `tailwind.config.ts` needed — configuration is done via CSS.

### Dark / Light theme — class strategy (2026-06-24)
Tailwind `darkMode: 'class'` (class on `<html>`). Choice persisted in `localStorage`.
`ThemeProvider` is a Client Component wrapping the layout; it reads `localStorage` on
mount to avoid flash of wrong theme.
Do NOT use `prefers-color-scheme` media query alone — user must be able to override it.

### Responsive layout — mobile-first with desktop sidebar (2026-06-24)
- Mobile (`< md`): bottom navigation bar, full-width single-column content.
- Desktop (`md+`): left sidebar for navigation, content area max-w-2xl centered.
The split is handled purely via Tailwind responsive prefixes — no JS breakpoint detection.
