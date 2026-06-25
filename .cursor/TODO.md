# TODO — NoviFood

## Ready to implement ✅ (все выполнено)

- [x] Day 2: `MacroSummary.tsx` — кольца/бары прогресса КБЖУ
- [x] Day 2: `AddMealForm.tsx` — форма ручного ввода (название, КБЖУ, meal_type, время)
- [x] Day 2: подключить `addMeal` / `deleteMeal` к UI, live reload без перезагрузки страницы
- [x] Day 3: `CameraUpload.tsx` — `<input type="file" capture="environment">`
- [x] Day 3: сквозной тест: камера → compress → /api/analyze-food → Gemini → JSON
- [x] Day 3: `PortionSelector.tsx` — множитель 0.5x – 2x
- [x] Day 4: `MealCard.tsx` — inline редактирование
- [x] Day 4: `/history` — календарь с переходом по дням
- [x] Day 5: `/weight` — логирование и график веса
- [x] Day 5: `/settings` — изменение целей КБЖУ
- [x] Day 5: PWA иконки (192x192, 512x512), проверка "Add to Home Screen"

## Интернационализация ✅ (выполнено 2026-06-25)

- [x] `src/lib/i18n.ts` — словари `en` и `ru`, тип `TranslationKey`
- [x] `LanguageProvider` — хранение выбора в `localStorage`, React Context
- [x] Хук `useT()` — возвращает функцию перевода по ключу
- [x] Кнопка переключения EN / RU в layout
- [x] Все строки в компонентах через `useT()` — никаких хардкоженных текстов
- [x] Дата и числа форматировать через `Intl` с учётом локали

## Тема и адаптивность ✅ (выполнено 2026-06-25)

- [x] `ThemeProvider` — хранение выбора в `localStorage`, класс `dark` на `<html>`
- [x] Кнопка переключения темы в layout (sun/moon иконки из lucide-react)
- [x] Все компоненты покрыть `dark:` классами Tailwind
- [x] Десктопный layout: боковая панель навигации вместо bottom-bar при `md:` и выше
- [x] Мобильный layout: bottom-navigation остаётся для `< md`
- [x] Мета-тег `theme-color` переключается динамически (выполнено 2026-06-25)

## День 7 ✅ (выполнено 2026-06-25)

- [x] `MacroSummary` добавлен на страницу `/history` (с settings через server component)
- [x] Поле `notes` добавлено в `AddMealForm` и `MealCard`
- [x] `deleteWeight(id)` добавлен в `weight.ts`, кнопка удаления в `/weight`
- [x] Новые unit-тесты: `SettingsClient.test.tsx`, `WeightClient.test.tsx`

## Blocked by user action

- [x] Создать Supabase проект ✅
- [x] Выполнить SQL (применено через supabase db push) ✅
- [ ] Заполнить `.env.local` → добавить GEMINI_API_KEY
- [ ] Задеплоить на Vercel, установить env vars в дашборде
