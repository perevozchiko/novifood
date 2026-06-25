# Calorie AI — Спецификация и План Разработки (v1.3)

Этот документ содержит полную архитектуру, структуру, код конфигураций, типов и ключевых утилит для личного трекера калорий. Приложение разрабатывается для ОДНОГО пользователя.

> **Легенда статусов:** ✅ Выполнено · 🔲 Запланировано

---

## 🛠 Технологический стек

| Слой | Технология | Примечание |
|------|-----------|------------|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS | Современный каркас с SSR/CSR |
| **База данных** | Supabase (Postgres) | Бесплатный тариф (до 500 МБ текста) |
| **ИИ-модель** | Gemini 2.0 Flash | Самая быстрая мультимодальная модель, бесплатный лимит |
| **Деплой** | Vercel | Идеальная интеграция с Next.js, поддержка Edge/Serverless |
| **Иконки** | lucide-react | Набор легковесных SVG иконок |
| **Unit-тесты** | Vitest + React Testing Library | Тестирование компонентов и утилит |
| **E2E-тесты** | Playwright | Сквозное тестирование навигации и UI |

---

## 📂 Структура проекта ✅

```text
novifood/
├── src/
│   ├── app/
│   │   ├── page.tsx                 ✅ Главный экран (Дневник за сегодня)
│   │   ├── DiaryClient.tsx          ✅ Клиентская оболочка дневника
│   │   ├── history/
│   │   │   ├── page.tsx             ✅ История по дням
│   │   │   └── HistoryClient.tsx    ✅ Клиентская навигация по дням
│   │   ├── weight/
│   │   │   ├── page.tsx             ✅ Контроль веса
│   │   │   └── WeightClient.tsx     ✅ Форма и график веса
│   │   ├── settings/
│   │   │   ├── page.tsx             ✅ Настройки целей КБЖУ
│   │   │   └── SettingsClient.tsx   ✅ Форма редактирования целей
│   │   ├── api/
│   │   │   └── analyze-food/
│   │   │       └── route.ts         ✅ Защищённый API-эндпоинт для Gemini
│   │   ├── manifest.ts              ✅ Конфигурация PWA
│   │   └── layout.tsx               ✅ Общий Layout + навигация
│   │
│   ├── components/
│   │   ├── MealCard.tsx             ✅ Карточка блюда + инлайн-редактирование
│   │   ├── MacroSummary.tsx         ✅ Виджет прогресса КБЖУ (кольцо + бары)
│   │   ├── AddMealForm.tsx          ✅ Форма ручного ввода еды
│   │   ├── CameraUpload.tsx         ✅ Логика фото (захват + сжатие + ИИ)
│   │   └── PortionSelector.tsx      ✅ Быстрый множитель порции (0.5x–2x)
│   │
│   ├── lib/
│   │   ├── supabase-browser.ts      ✅ Инициализация Supabase для Client Components
│   │   ├── supabase-server.ts       ✅ Инициализация Supabase для Server Components
│   │   ├── meals.ts                 ✅ CRUD операции для приёмов пищи
│   │   ├── settings.ts              ✅ Чтение и обновление целей КБЖУ
│   │   ├── weight.ts                ✅ CRUD операции для веса
│   │   ├── gemini.ts                ✅ Серверная функция запроса к ИИ
│   │   └── compress-image.ts        ✅ Клиентское сжатие картинок в Canvas
│   │
│   └── types/
│       └── index.ts                 ✅ Глобальные типы TypeScript
│
├── __tests__/                       ✅ Unit-тесты (Vitest + RTL)
│   ├── MacroSummary.test.tsx
│   ├── MealCard.test.tsx
│   ├── AddMealForm.test.tsx
│   ├── PortionSelector.test.tsx
│   └── compress-image.test.ts
│
├── e2e/                             ✅ E2E-тесты (Playwright)
│   ├── navigation.spec.ts
│   └── diary.spec.ts
│
├── public/
│   └── icons/                       ✅ Иконки для PWA (192×192, 512×512)
│
├── vitest.config.mts                ✅ Конфигурация Vitest
├── playwright.config.ts             ✅ Конфигурация Playwright
├── .env.local                       🔲 Локальные ключи (в .gitignore)
└── next.config.ts                   ✅ Конфигурация Next.js
```

---

## 🗄 1. База данных — Финальный SQL (Supabase SQL Editor) ✅

```sql
-- Таблица 1: Приёмы пищи
create table meals (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  eaten_at    timestamptz default now(),
  name        text not null,
  meal_type   text,                  -- breakfast, lunch, dinner, snack
  calories    integer default 0,
  protein     integer default 0,
  fat         integer default 0,
  carbs       integer default 0,
  notes       text
);

-- Таблица 2: Настройки целей (всегда одна строка с id = 1)
create table settings (
  id              integer primary key default 1 check (id = 1),
  calorie_goal    integer default 2200,
  protein_goal    integer default 150,
  fat_goal        integer default 80,
  carbs_goal      integer default 250
);

insert into settings (id, calorie_goal, protein_goal, fat_goal, carbs_goal)
values (1, 2200, 150, 80, 250)
on conflict (id) do nothing;

-- Таблица 3: Логирование веса
create table weight (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  value       numeric not null
);
```

---

## 🔑 2. Конфигурация окружения — `.env.local` ✅

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
```

> ⚠️ `GEMINI_API_KEY` не имеет префикса `NEXT_PUBLIC_` — ключ доступен только на сервере.

---

## 📐 3. Описание типов — `src/types/index.ts` ✅

```typescript
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  created_at: string;
  eaten_at: string;
  name: string;
  meal_type: MealType | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  notes: string | null;
}

export interface Settings {
  id: 1;
  calorie_goal: number;
  protein_goal: number;
  fat_goal: number;
  carbs_goal: number;
}

export interface Weight {
  id: string;
  created_at: string;
  value: number;
}

export interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}
```

---

## 🧠 4. Клиенты Supabase — `src/lib/` ✅

Реализованы `supabase-browser.ts` (для Client Components) и `supabase-server.ts` (для Server Components).

---

## 💾 5. Сервисы данных — `src/lib/` ✅

- `meals.ts` — полный CRUD: `getMealsByDate`, `addMeal`, `updateMeal`, `deleteMeal`
- `settings.ts` — `getSettings`, `updateSettings`
- `weight.ts` — `getWeightHistory`, `addWeight`

---

## 🤖 6. ИИ-логика (сервер) — `src/lib/gemini.ts` ✅

Запрос к Gemini 2.0 Flash с base64-изображением. Ответ парсится как JSON с полями `name`, `calories`, `protein`, `fat`, `carbs`.

---

## 🌐 7. Роутинг и PWA ✅

- `POST /api/analyze-food` — защищённый роут, вызывает `analyzeFood()`
- `src/app/manifest.ts` — PWA-манифест с иконками и `display: standalone`
- `public/icons/icon-192.png`, `icon-512.png` — иконки PWA

---

## 📉 8. Клиентское сжатие — `src/lib/compress-image.ts` ✅

Canvas-утилита: сжимает изображение до 800px по длинной стороне, конвертирует в JPEG (качество 80%), возвращает base64 без заголовка.

---

## 🧩 9. Компоненты — `src/components/` ✅

| Компонент | Описание |
|-----------|----------|
| `MacroSummary` | Кольцо калорий + прогресс-бары Б/Ж/У |
| `MealCard` | Карточка блюда с инлайн-редактированием и удалением |
| `AddMealForm` | Форма ручного ввода (название, тип, КБЖУ) |
| `CameraUpload` | Захват фото → сжатие → `/api/analyze-food` → `PortionSelector` |
| `PortionSelector` | Кнопки 0.5x / 0.75x / 1x / 1.5x / 2x |

---

## 🧪 10. Тестирование ✅

### Unit-тесты (Vitest + React Testing Library)

Файлы в `__tests__/`:

| Файл | Что покрывает |
|------|--------------|
| `MacroSummary.test.tsx` | Расчёт суммы калорий, отображение цели, пустое состояние |
| `MealCard.test.tsx` | Рендер, удаление, инлайн-редактирование, отмена |
| `AddMealForm.test.tsx` | Открытие формы, валидация, submit, отмена |
| `PortionSelector.test.tsx` | Рендер кнопок, выделение активной, вызов onChange |
| `compress-image.test.ts` | Успешное сжатие, ошибка загрузки изображения |

Запуск:
```bash
npm test              # однократный прогон
npm run test:watch    # режим watch
```

### E2E-тесты (Playwright)

Файлы в `e2e/`:

| Файл | Что покрывает |
|------|--------------|
| `navigation.spec.ts` | Переход по всем 4 страницам через нижнюю навигацию |
| `diary.spec.ts` | Кнопка добавления блюда, форма, камера, отмена |

Запуск:
```bash
npm run test:e2e
```

> E2E-тесты автоматически поднимают `next dev` через `webServer` в `playwright.config.ts`. Для полного прохождения тестов, требующих данных, нужна рабочая `.env.local`.

---

## 📅 11. Пошаговый план спринта (5 дней)

### День 1: Инфраструктурный фундамент ✅

- [x] Инициализация Next.js 16 + TypeScript + Tailwind CSS + App Router
- [x] Зависимости: `@supabase/supabase-js`, `lucide-react`
- [x] SQL-таблицы в Supabase: `meals`, `settings`, `weight`
- [x] Файлы конфигурации `.env.local.example`, `src/lib/`
- [x] Базовый Layout с нижней навигацией (4 пункта)
- [x] Страницы-заглушки: `/`, `/history`, `/weight`, `/settings`
- [x] Миграция `supabase/migrations/0001_init.sql` применена к remote

### День 2: Ядро бизнес-логики (ручной учёт) ✅

- [x] Компонент `MacroSummary.tsx` — кольцо калорий + прогресс-бары
- [x] Компонент `AddMealForm.tsx` — форма: название, КБЖУ, тип, валидация
- [x] Компонент `MealCard.tsx` — отображение блюда
- [x] `page.tsx` — Server Component, передаёт данные в `DiaryClient`
- [x] `DiaryClient.tsx` — управление состоянием списка блюд

### День 3: Интеграция с ИИ ✅

- [x] Утилита `compress-image.ts`
- [x] Компонент `CameraUpload.tsx` — `<input capture="environment">` + Gemini
- [x] Компонент `PortionSelector.tsx` — множитель порции
- [x] Сквозной сценарий: Камера → Сжатие → API → Gemini → JSON → Дневник

### День 4: Редактирование и История ✅

- [x] `MealCard.tsx` — инлайн-редактирование всех полей
- [x] Страница `/history` — навигация по датам, список блюд, редактирование

### День 5: Мониторинг веса, настройки, PWA ✅

- [x] Страница `/weight` — форма добавления + sparkline-график + история
- [x] Страница `/settings` — форма редактирования целей КБЖУ
- [x] Иконки PWA `public/icons/icon-192.png`, `icon-512.png`

### Тестирование ✅

- [x] Vitest + React Testing Library: 4 компонента + 1 утилита
- [x] Playwright: навигация + основные сценарии дневника

---

## 🏷 12. Версия приложения ✅

Версия отображается в нижней панели навигации в виде тихого, не кликабельного бейджа:

```
v0.1.0 (a3f9c1b)
```

- Базовая версия (`v0.1.0`) задаётся вручную в `NEXT_PUBLIC_APP_VERSION`.
- Хеш (`a3f9c1b`) читается из git при сборке и вставляется в `NEXT_PUBLIC_GIT_HASH`.
- Оба значения инжектируются в `next.config.ts` через поле `env`, доступны на сервере и клиенте.

### Реализация

| Файл | Изменение |
|------|-----------|
| `next.config.ts` | `execSync('git rev-parse --short HEAD')` → `NEXT_PUBLIC_GIT_HASH`; `NEXT_PUBLIC_APP_VERSION = '0.1.0'` |
| `src/app/layout.tsx` | `<span>` с `absolute bottom-0.5` внутри `<nav>`, не влияет на высоту |

---

## 📅 13. Пошаговый план спринта — День 6 (Полировка)

> День 6 охватывает возможности, запланированные в `.cursor/TODO.md` и `DECISIONS.md`.

### 13.1 Интернационализация (i18n) ✅

- [x] `src/lib/i18n.ts` — словари `en` и `ru`, тип `TranslationKey`
- [x] `src/providers/LanguageProvider.tsx` — React Context + хранение выбора в `localStorage`
- [x] Хук `useT()` — возвращает функцию перевода по ключу
- [x] Кнопка EN / RU в layout рядом с иконкой темы
- [x] Все строки в компонентах через `useT()` — никаких хардкоженных текстов
- [x] Дата и числа форматировать через `Intl` с учётом локали

### 13.2 Тёмная / светлая тема ✅

- [x] `src/providers/ThemeProvider.tsx` — класс `dark` на `<html>`, `localStorage`, React Context
- [x] Кнопка переключения темы в layout (иконки `Sun` / `Moon` из lucide-react)
- [x] Все компоненты покрыть `dark:` классами Tailwind (фон, текст, карточки, форма, навигация)
- [x] Anti-FOUC скрипт в `<head>` — читает `localStorage` до первого рендера
- [x] Мета-тег `theme-color` переключается динамически при смене темы

### 13.3 Адаптивный layout (mobile + desktop) ✅

- [x] Мобильный (`< md`): нижняя навигация остаётся как есть
- [x] Десктопный (`md+`): левая боковая панель навигации (`NavLinks` variant="sidebar")
- [x] Переключение реализовано через Tailwind responsive-префиксы без JS breakpoint detection

### 13.4 Версия приложения ✅

- [x] `next.config.ts` — инжекция `NEXT_PUBLIC_APP_VERSION` и `NEXT_PUBLIC_GIT_HASH` при сборке
- [x] `src/app/layout.tsx` — бейдж версии в нижней навигации (абсолютное позиционирование, 8px)

---

## ⚡ 14. Исправление производительности переключения табов ✅

### Причина задержки

Каждый переход по вкладке вызывал полный серверный рендер с запросом к Supabase (`force-dynamic`).

### Решение — Next.js 16 Cache Components + PPR

- [x] `next.config.ts` — `cacheComponents: true` — включает Partial Prerendering
- [x] Удалён `export const dynamic = 'force-dynamic'` со всех страниц
- [x] Страницы `/`, `/weight`, `/settings` реструктурированы:
  - Заголовок рендерится статически (мгновенно при навигации)
  - Данные загружаются через async компонент + `<Suspense>` с skeleton
  - `connection()` из `next/server` перед Supabase вызовами (request-time)
- [x] Страница `/history` — `HistoryClient` обёрнут в `<Suspense>` (дата вычисляется на клиенте)
- [x] `TodayDate` — Client Component, тоже обёрнут в `<Suspense>` (нет `new Date()` в статическом shell)
- [x] Скелетоны с `animate-pulse` для визуальной обратной связи во время загрузки
- [x] React Activity (`cacheComponents`) сохраняет до 3 страниц в памяти — повторная навигация мгновенная

---

## 📅 15. Пошаговый план спринта — День 7 (Расширение функциональности) ✅

### 15.1 MacroSummary на странице истории ✅

- [x] Страница `/history` — добавлен async компонент `HistoryContent` (Server Component)
- [x] `HistoryContent` загружает `settings` server-side и передаёт в `HistoryClient`
- [x] `HistoryClient` отображает `MacroSummary` для выбранного дня (не только для сегодня)

### 15.2 Поле «Заметки» для блюда ✅

- [x] `AddMealForm.tsx` — необязательное поле `notes` (textarea)
- [x] `MealCard.tsx` — отображение `notes` как italic-подпись, редактирование в inline-форме
- [x] Поле `notes` уже присутствует в типе `Meal` и таблице `meals.notes`

### 15.3 Удаление записей веса ✅

- [x] `src/lib/weight.ts` — функция `deleteWeight(id: string)`
- [x] `WeightClient.tsx` — кнопка удаления рядом с каждой записью истории
- [x] Optimistic UI: запись удаляется из state немедленно

### 15.4 Новые unit-тесты ✅

- [x] `__tests__/SettingsClient.test.tsx` — 8 тестов: рендер, изменение полей, submit, отмена
- [x] `__tests__/WeightClient.test.tsx` — 7 тестов: рендер, добавление, удаление, график

---

## 🎨 16. Динамический мета-тег theme-color ✅

### Назначение

Мета-тег `theme-color` управляет цветом адресной строки и UI браузера на мобильных устройствах (Android Chrome, Safari iOS). При смене темы тег обновляется динамически.

### Реализация

| Файл | Изменение |
|------|-----------|
| `src/app/layout.tsx` | Статический `<meta name="theme-color">` с начальным значением (светлая тема) |
| `src/providers/ThemeProvider.tsx` | `applyTheme()` обновляет `content` мета-тега через `document.querySelector` |

- Светлая тема → `#ffffff`
- Тёмная тема → `#1f2937` (соответствует `bg-gray-800` в Tailwind)

---

## 📅 17. Пошаговый план спринта — День 8 (Недельная статистика) ✅

### 17.1 Утилиты для статистики ✅

- [x] `src/lib/meals.ts` — `getMealsByDateRange(from, to)` — загрузка блюд за диапазон дат (server-side)
- [x] `src/lib/meals.ts` — `getRecentMeals(limit)` — последние N уникальных блюд (client-side)
- [x] `src/lib/meals.ts` — `computeStreak(dates)` — чистая функция подсчёта серии дней
- [x] `src/lib/meals.ts` — `getMealDates()` — все дни с записями (server-side, для стрика)
- [x] `src/lib/i18n.ts` — ключи `stats.*`, `addMeal.recent`, `settings.appearance/*`

### 17.2 Страница статистики `/stats` ✅

- [x] `src/app/stats/page.tsx` — Server Component с PPR + Suspense + skeleton
- [x] `src/app/stats/StatsClient.tsx`:
  - SVG bar chart: 7 баров (последние 7 дней), пунктирная линия цели, оранжевый цвет при превышении
  - Средние КБЖУ за дни с данными
  - Итого за неделю (калории + Б/Ж/У)
  - Бейдж серии 🔥 (если streak > 0)
- [x] `src/app/NavLinks.tsx` — добавлена вкладка 📊 «Статистика / Stats»

---

## 📅 18. Пошаговый план спринта — День 9 (Быстрое добавление) ✅

### 18.1 Чипы недавних блюд в AddMealForm ✅

- [x] `src/components/AddMealForm.tsx` — при открытии формы запрашивает `getRecentMeals(5)` через browser client
- [x] Чипы-кнопки с именами блюд заполняют форму одним кликом (название + КБЖУ + тип + заметки)
- [x] Чипы появляются только после открытия формы (lazy fetch)

---

## 📅 19. Пошаговый план спринта — День 10 (Стрик + UX) ✅

### 19.1 Серия дней (streak) на главной странице ✅

- [x] `src/app/page.tsx` — `DiaryDataLoader` дополнительно загружает `getMealDates()` и вычисляет `computeStreak()`
- [x] `src/app/DiaryClient.tsx` — принимает `streak: number`, показывает 🔥-бейдж при streak ≥ 2
- [x] Бейдж повторяет дизайн аналогичного блока на странице `/stats`

### 19.2 Перенос настроек внешнего вида ✅

- [x] `src/app/layout.tsx` — убраны `ThemeToggle`, `LangToggle`, версия из мобильного bottom bar
- [x] `src/app/settings/SettingsClient.tsx` — добавлен раздел «Внешний вид»:
  - Сегментный переключатель темы (Светлая / Тёмная с иконками Sun/Moon)
  - Сегментный переключатель языка (RU / EN)
  - Версия приложения `v0.1.0 (hash)`

### 19.3 Новые unit-тесты ✅

- [x] `__tests__/computeStreak.test.ts` — 8 тестов чистой функции (0 дней, 1 день, серия, разрыв, дубли)
- [x] `__tests__/StatsClient.test.tsx` — 9 тестов (рендер, нет данных, среднее, итого, стрик)

---

## 📅 20. Пошаговый план спринта — День 11 (Экспорт и поиск) ✅

### 20.1 Экспорт данных в CSV ✅

- [x] `src/lib/export-csv.ts` — `exportMealsCsv(meals)` и `exportWeightCsv(history)`
  - Клиентская утилита: Blob → `<a>` download, без серверного запроса
  - BOM (`\uFEFF`) для корректного открытия в Excel
  - Экранирование запятых и кавычек в полях
- [x] `src/lib/i18n.ts` — ключи `settings.data`, `settings.export.*`
- [x] `src/app/settings/SettingsClient.tsx` — раздел «Данные»: кнопки «Экспорт питания» и «Экспорт веса»
  - Lazy fetch данных при клике (не при загрузке страницы)
  - Состояния загрузки на кнопках

### 20.2 Поиск по истории блюд ✅

- [x] `src/lib/i18n.ts` — ключи `history.search`, `history.searchEmpty`
- [x] `src/app/history/HistoryClient.tsx` — поле поиска появляется над списком блюд
  - Фильтрация по имени блюда и заметкам (case-insensitive)
  - Иконка Search + крестик очистки (`lucide-react`)
  - MacroSummary показывает итоги за весь день (не фильтрованные)
  - Сообщение «Ничего не найдено» при пустом результате

---

## 📅 21. Пошаговый план спринта — День 12 (PWA + тесты) ✅

### 21.1 PWA Service Worker с offline fallback ✅

- [x] `public/sw.js` — сервис-воркер:
  - На install: прекешируются `/` и `/offline`
  - Стратегия navigation: network-first → при ошибке возвращает `/offline`
  - Стратегия assets: cache-first (статика, иконки, JS чанки)
  - API-роуты (`/api/*`) не перехватываются
- [x] `src/app/offline/page.tsx` — страница «Нет подключения» с кнопкой «Обновить»
- [x] `src/app/layout.tsx` — регистрация SW через inline скрипт (event `load`)

### 21.2 Тесты ✅

- [x] `__tests__/export-csv.test.ts` — 10 тестов (триггер скачивания, имя файла, заголовки, данные, экранирование)
