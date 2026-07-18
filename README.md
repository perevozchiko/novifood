# NoviFood

## Product data

NoviFood keeps a small local cache of products requested by users instead of
importing the full Open Food Facts catalogue. Product data is provided by
[Open Food Facts](https://world.openfoodfacts.org/) and is available under the
[Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/).

NoviFood — a simple and smart nutrition tracker for calories, meals, and healthy habits.

Подробное описание возможностей, архитектуры, данных и API: [docs/plan.md](docs/plan.md).

---

## Setup

### 1. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project → Settings → API.
- `GEMINI_API_KEY` — create at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (**not** Google Cloud Console). Valid formats: `AIzaSy…` (legacy) or `AQ.Ab…` (auth key, default since 2026).

> For Vercel: add all three variables under Project → Settings → Environment Variables, then redeploy.

### 2. Database migrations

All eight migrations must be applied to the Supabase database. Run:

```bash
npx supabase db push
```

Or apply each file manually in the Supabase SQL editor:

| File | What it creates |
|------|-----------------|
| `supabase/migrations/0001_init.sql` | Tables `meals`, `settings`, `weight` |
| `supabase/migrations/0002_water_intake.sql` | Table `water_intake` + column `settings.water_goal_ml` |
| `supabase/migrations/0003_ai_rate_limit.sql` | Table `ai_usage` (daily AI quota counter) |
| `supabase/migrations/0004_auth.sql` | Per-user auth: `user_id` columns, RLS, sign-up trigger |
| `supabase/migrations/0005_products.sql` | Shared Open Food Facts product cache |
| `supabase/migrations/0006_product_cache_and_personal_products.sql` | Product cache search and per-user products |
| `supabase/migrations/0007_dedupe_personal_products.sql` | Deduplication and normalized personal product names |
| `supabase/migrations/0008_add_meal_weight.sql` | Optional actual serving weight for diary meals |

> **If migration 0002 is not applied:** the Water tracker shows `0 / undefined мл` and saving water entries fails with "Не удалось сохранить".
>
> **If migration 0003 is not applied:** AI food analysis may fail due to missing `ai_usage` table.
>
> **If migration 0004 is not applied:** settings/history/stats/diary fail with `column settings.user_id does not exist` (HTTP 400).
>
> **If `GEMINI_API_KEY` is not set:** voice food analysis is unavailable.

### 3. Verify AI key

After deployment, open `/api/check-gemini` in the browser to verify the Gemini API key is loaded and valid.

---

## Development

```bash
npm install
npm run dev
```

## Tests

```bash
npm test          # unit tests (Vitest)
npm run test:e2e  # end-to-end tests (Playwright)
```
