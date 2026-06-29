# NoviFood

NoviFood — a simple and smart nutrition tracker for calories, meals, and healthy habits.

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
- `GEMINI_API_KEY` — create at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (**not** Google Cloud Console). Must start with `AIza`.

> For Vercel: add all three variables under Project → Settings → Environment Variables, then redeploy.

### 2. Database migrations

All three migrations must be applied to the Supabase database. Run:

```bash
npx supabase db push
```

Or apply each file manually in the Supabase SQL editor:

| File | What it creates |
|------|-----------------|
| `supabase/migrations/0001_init.sql` | Tables `meals`, `settings`, `weight` |
| `supabase/migrations/0002_water_intake.sql` | Table `water_intake` + column `settings.water_goal_ml` |
| `supabase/migrations/0003_ai_rate_limit.sql` | Table `ai_usage` (daily AI quota counter) |

> **If migration 0002 is not applied:** the Water tracker shows `0 / undefined мл` and saving water entries fails with "Не удалось сохранить".
>
> **If migration 0003 is not applied:** AI food analysis may fail due to missing `ai_usage` table.
>
> **If `GEMINI_API_KEY` is not set:** the "Распознать ИИ" and "Голосовой ввод" buttons show "Распознавание ИИ недоступно. Администратору необходимо настроить API-ключ."

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
