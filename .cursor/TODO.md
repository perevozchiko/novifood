# TODO — NoviFood

## Ready to implement

- [ ] Day 2: `MacroSummary.tsx` — кольца/бары прогресса КБЖУ
- [ ] Day 2: `AddMealForm.tsx` — форма ручного ввода (название, КБЖУ, meal_type, время)
- [ ] Day 2: подключить `addMeal` / `deleteMeal` к UI, live reload без перезагрузки страницы
- [ ] Day 3: `CameraUpload.tsx` — `<input type="file" capture="environment">`
- [ ] Day 3: сквозной тест: камера → compress → /api/analyze-food → Gemini → JSON
- [ ] Day 3: `PortionSelector.tsx` — множитель 0.5x – 2x
- [ ] Day 4: `MealCard.tsx` — inline редактирование
- [ ] Day 4: `/history` — календарь с переходом по дням
- [ ] Day 5: `/weight` — логирование и график веса
- [ ] Day 5: `/settings` — изменение целей КБЖУ
- [ ] Day 5: PWA иконки (192x192, 512x512), проверка "Add to Home Screen"

## Тема и адаптивность (добавлено 2026-06-24)

- [ ] `ThemeProvider` — хранение выбора в `localStorage`, класс `dark` на `<html>`
- [ ] Кнопка переключения темы в layout (sun/moon иконки из lucide-react)
- [ ] Все компоненты покрыть `dark:` классами Tailwind (фон, текст, карточки, форма, навигация)
- [ ] Десктопный layout: боковая панель навигации вместо bottom-bar при `md:` и выше
- [ ] Мобильный layout: bottom-navigation остаётся для `< md`
- [ ] Мета-тег `theme-color` переключается динамически под светлую/тёмную тему
- [ ] Проверить на реальном мобильном устройстве (PWA + браузер)

## Blocked by user action

- [x] Создать Supabase проект ✅
- [x] Выполнить SQL (применено через supabase db push) ✅
- [ ] Заполнить `.env.local` → добавить GEMINI_API_KEY
- [ ] Задеплоить на Vercel, установить env vars в дашборде
