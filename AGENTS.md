# Repository Guidelines

## Project Structure & Module Organization

NoviFood is a Next.js App Router application written in TypeScript.

- `src/app/` contains routes, layouts, API handlers, and page-level clients.
- `src/components/` contains reusable UI components; `src/providers/` contains React context providers.
- `src/lib/` contains Supabase access, nutrition/diary logic, AI integrations, caching, and import/export helpers.
- `src/types/` contains shared TypeScript types.
- `__tests__/` contains Vitest unit and component tests; `e2e/` contains Playwright browser tests.
- `supabase/migrations/` contains ordered database migrations. Static/PWA assets belong in `public/`.

## Build, Test, and Development Commands

Install dependencies with `npm install`, then start development with `npm run dev` (this generates the service worker before starting Next.js).

- `npm run build`: generate the service worker and create a production build.
- `npm start`: serve the production build locally.
- `npm run lint`: run the ESLint Next.js and TypeScript rules.
- `npm test`: run Vitest once; use `npm run test:watch` during focused development.
- `npm run test:e2e`: run Playwright against a local server at `http://localhost:3000`.
- `npx supabase db push`: apply local migrations to the linked Supabase project.

## Coding Style & Naming Conventions

Use TypeScript, two-space indentation, single quotes where the surrounding file does, and semicolons consistent with the existing code. Prefer small, focused components and colocate route-specific clients with their route. Name React components and providers in PascalCase, hooks with a `use` prefix, and utility modules/functions in descriptive kebab-case or camelCase matching nearby code. Run `npm run lint` before submitting changes.

## Testing Guidelines

Name unit tests `*.test.ts` or `*.test.tsx` and browser tests `*.spec.ts`. Add or update tests for changed behavior, especially API handlers, data helpers, and user-facing components. Vitest runs in `jsdom`; Playwright uses Chromium. No explicit coverage threshold is configured.

## Commit & Pull Request Guidelines

Recent commits use concise imperative subjects with conventional prefixes such as `feat(scope): ...`, `fix(scope): ...`, and `Revert ...`. Follow that pattern and keep each commit focused. Pull requests should explain the behavior changed, identify database or environment-variable requirements, link related issues, and include screenshots for visual changes. Mention the validation commands run.

## Security & Configuration

Keep Supabase and Gemini credentials in `.env.local` or deployment environment settings; never commit secrets. Apply all required Supabase migrations before testing authenticated, diary, statistics, water, or AI flows.
