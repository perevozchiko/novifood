# TODO — NoviFood

## Done (Day 1–5 + Version + Day 6)

- [x] Day 1: Next.js scaffold, Supabase setup, layout, page stubs
- [x] Day 2: MacroSummary, AddMealForm, MealCard, DiaryClient
- [x] Day 3: CameraUpload, PortionSelector, compress-image, AI integration
- [x] Day 4: Inline editing in MealCard, History page
- [x] Day 5: Weight tracking, Settings, PWA icons
- [x] Version badge (NEXT_PUBLIC_APP_VERSION + NEXT_PUBLIC_GIT_HASH)
- [x] `src/lib/i18n.ts` — EN/RU dictionaries, `getTranslations()`, `getLocale()`
- [x] `LanguageProvider` — localStorage persistence, `useT()`, `useLang()` hooks
- [x] `ThemeProvider` — localStorage persistence, dark class on `<html>`, theme-color meta
- [x] `AppShell` — responsive nav: bottom bar on mobile, sidebar on desktop (`md+`)
- [x] Theme toggle (Sun/Moon) + language toggle (EN/RU) in layout
- [x] All components use `dark:` Tailwind classes
- [x] All components use `useT()` for strings
- [x] Dates formatted via `Intl` with active locale
- [x] Unit tests: ThemeProvider (6), LanguageProvider (6)
- [x] All existing unit tests updated to use `renderWithProviders`

## Blocked by user action

- [x] Создать Supabase проект ✅
- [x] Выполнить SQL (применено через supabase db push) ✅
- [ ] Заполнить `.env.local` → добавить GEMINI_API_KEY
- [ ] Задеплоить на Vercel, установить env vars в дашборде
