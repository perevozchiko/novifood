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

### 13.1 Интернационализация (i18n) 🔲

- [ ] `src/lib/i18n.ts` — словари `en` и `ru`, тип `TranslationKey`
- [ ] `src/providers/LanguageProvider.tsx` — React Context + хранение выбора в `localStorage`
- [ ] Хук `useT()` — возвращает функцию перевода по ключу
- [ ] Кнопка EN / RU в layout рядом с иконкой темы
- [ ] Все строки в компонентах через `useT()` — никаких хардкоженных текстов
- [ ] Дата и числа форматировать через `Intl` с учётом локали

### 13.2 Тёмная / светлая тема 🔲

- [ ] `src/providers/ThemeProvider.tsx` — класс `dark` на `<html>`, `localStorage`, React Context
- [ ] Кнопка переключения темы в layout (иконки `Sun` / `Moon` из lucide-react)
- [ ] Все компоненты покрыть `dark:` классами Tailwind (фон, текст, карточки, форма, навигация)
- [ ] Мета-тег `theme-color` переключается динамически под светлую/тёмную тему

### 13.3 Адаптивный layout (mobile + desktop) 🔲

- [ ] Мобильный (`< md`): нижняя навигация остаётся как есть
- [ ] Десктопный (`md+`): левая боковая панель навигации, контент `max-w-2xl` по центру
- [ ] Переключение реализовано через Tailwind responsive-префиксы без JS breakpoint detection

### 13.4 Версия приложения ✅

- [x] `next.config.ts` — инжекция `NEXT_PUBLIC_APP_VERSION` и `NEXT_PUBLIC_GIT_HASH` при сборке
- [x] `src/app/layout.tsx` — бейдж версии в нижней навигации (абсолютное позиционирование, 8px)
