Этот план выглядит монолитно и полностью готов к реализации. Стек выбран идеально, разделение на клиентский/серверный Supabase учтено, а архитектура базы данных для одного пользователя — максимально лаконичная. Вы с нейросетями проделали отличную работу.
Чтобы вам было удобно держать весь этот план перед глазами во время разработки (или загрузить его в Cursor / IDE), я объединил весь этот массив данных в один структурированный файл.
Вы можете скопировать код ниже и сохранить его как PLAN.md в корне вашего будущего проекта.
# Calorie AI — Спецификация и План Разработки (v1.1)

Этот документ содержит полную архитектуру, структуру, код конфигураций, типов и ключевых утилит для личного трекера калорий. Приложение разрабатывается для ОДНОГО пользователя.

---

## 🛠 Технологический стек

| Слой | Технология | Примечание |
|------|-----------|------------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS | Современный каркас с SSR/CSR |
| **База данных** | Supabase (Postgres) | Бесплатный тариф (до 500 МБ текста) |
| **ИИ-модель** | Gemini 2.0 Flash | Самая быстрая мультимодальная модель, бесплатный лимит |
| **Деплой** | Vercel | Идеальная интеграция с Next.js, поддержка Edge/Serverless |
| **Иконки** | lucide-react | Набор легковесных SVG иконок |

---

## 📂 Структура проекта

```text
calorie-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Главный экран (Дневник за сегодня)
│   │   ├── history/
│   │   │   └── page.tsx             # История по дням (День 4)
│   │   ├── weight/
│   │   │   └── page.tsx             # Контроль веса (День 5)
│   │   ├── settings/
│   │   │   └── page.tsx             # Настройки целей КБЖУ (День 5)
│   │   ├── api/
│   │   │   └── analyze-food/
│   │   │       └── route.ts         # Защищенный API-эндпоинт для Gemini
│   │   ├── manifest.ts              # Конфигурация PWA
│   │   └── layout.tsx               # Общий Layout + навигация
│   │
│   ├── components/
│   │   ├── MealCard.tsx             # Карточка отображения блюда
│   │   ├── MacroSummary.tsx         # Виджет прогресса КБЖУ (кольца/бары)
│   │   ├── AddMealForm.tsx          # Форма ручного ввода еды
│   │   ├── CameraUpload.tsx         # Логика фото (захват + сжатие)
│   │   └── PortionSelector.tsx      # Быстрый множитель порции (0.5x - 2x)
│   │
│   ├── lib/
│   │   ├── supabase-browser.ts      # Инициализация Supabase для Client Components
│   │   ├── supabase-server.ts       # Инициализация Supabase для Server Components
│   │   ├── meals.ts                 # CRUD операции для приемов пищи
│   │   ├── settings.ts              # Чтение и обновление личных целей КБЖУ
│   │   ├── weight.ts                # CRUD операции для веса
│   │   ├── gemini.ts                # Серверная функция запроса к ИИ
│   │   └── compress-image.ts        # Клиентское сжатие картинок в Canvas
│   │
│   └── types/
│       └── index.ts                 # Глобальные типы TypeScript
│
├── public/
│   └── icons/                       # Иконки для PWA (192x192, 512x512)
│
├── .env.local                       # Локальные ключи (в .gitignore)
└── next.config.ts                   # Конфигурация Next.js


🗄 1. База данных — Финальный SQL (Supabase SQL Editor)
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
  notes       text                   -- Для заметок: "в гостях", "кафе"
);

-- Таблица 2: Настройки целей (Всегда одна строка с id = 1)
create table settings (
  id              integer primary key default 1 check (id = 1),
  calorie_goal    integer default 2200,
  protein_goal    integer default 150,
  fat_goal        integer default 80,
  carbs_goal      integer default 250
);

-- Инициализируем дефолтные настройки при создании БД
insert into settings (id, calorie_goal, protein_goal, fat_goal, carbs_goal) 
values (1, 2200, 150, 80, 250)
on conflict (id) do nothing;

-- Таблица 3: Логирование веса
create table weight (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  value       numeric not null
);


🔑 2. Конфигурация Окружения — .env.local
NEXT_PUBLIC_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=AIzaSy...


⚠️ Важно: GEMINI_API_KEY не имеет префикса NEXT_PUBLIC_, благодаря чему ключ никогда не утечет в браузер и будет доступен только на сервере Vercel.
📐 3. Описание типов — src/types/index.ts
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


🧠 4. Клиенты Supabase — src/lib/
src/lib/supabase-browser.ts (Клиентский)
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseBrowser = createClient(url, key)


src/lib/supabase-server.ts (Серверный)
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseServer = createClient(url, key)


💾 5. Сервисы интеграции данных — src/lib/
Дневник питания — src/lib/meals.ts
import { supabaseServer } from './supabase-server'
import { supabaseBrowser } from './supabase-browser'
import { Meal } from '@/types'

// Выборка за конкретную дату (Серверный компонент)
export async function getMealsByDate(dateStr: string): Promise<Meal[]> {
  const from = `${dateStr}T00:00:00.000Z`
  const to   = `${dateStr}T23:59:59.999Z`

  const { data, error } = await supabaseServer
    .from('meals')
    .select('*')
    .gte('eaten_at', from)
    .lte('eaten_at', to)
    .order('eaten_at', { ascending: true })

  if (error) throw error
  return data || []
}

// Добавление (Клиентский компонент)
export async function addMeal(meal: Omit<Meal, 'id' | 'created_at'>): Promise<Meal> {
  const { data, error } = await supabaseBrowser
    .from('meals')
    .insert(meal)
    .select()
    .single()

  if (error) throw error
  return data
}

// Обновление (Клиентский компонент)
export async function updateMeal(id: string, updates: Partial<Meal>): Promise<Meal> {
  const { data, error } = await supabaseBrowser
    .from('meals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Удаление (Клиентский компонент)
export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabaseBrowser
    .from('meals')
    .delete()
    .eq('id', id)

  if (error) throw error
}


Настройки КБЖУ — src/lib/settings.ts
import { supabaseServer } from './supabase-server'
import { supabaseBrowser } from './supabase-browser'
import { Settings } from '@/types'

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabaseServer
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) throw error
  return data
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const { data, error } = await supabaseBrowser
    .from('settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error
  return data
}


Учет Веса — src/lib/weight.ts
import { supabaseServer } from './supabase-server'
import { supabaseBrowser } from './supabase-browser'
import { Weight } from '@/types'

export async function getWeightHistory(): Promise<Weight[]> {
  const { data, error } = await supabaseServer
    .from('weight')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function addWeight(value: number): Promise<Weight> {
  const { data, error } = await supabaseBrowser
    .from('weight')
    .insert({ value })
    .select()
    .single()

  if (error) throw error
  return data
}


🤖 6. ИИ Логика (Сервер) — src/lib/gemini.ts
import { FoodAnalysis } from '@/types'

const MODEL = 'gemini-2.0-flash'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export async function analyzeFood(base64Image: string): Promise<FoodAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing in environment variables')

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `Analyse the food in this photo. 
Respond ONLY with a valid JSON object. Do not include markdown codeblocks, wrapping, or explanations. 
Structure:
{"name":"Dish Name in Russian","calories":0,"protein":0,"fat":0,"carbs":0}
All macro values must be integers representing the full portion visible in the photo. 
Calories in kcal, protein/fat/carbs in grams.`
          }
        ]
      }]
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errText}`)
  }

  const result = await response.json()
  const text = result.candidates[0].content.parts[0].text
  
  // Очистка от возможных markdown-тегов ИИ на всякий случай
  const cleanJson = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleanJson)
}


🌐 7. Роутинг и Окружение PWA
API Роут — src/app/api/analyze-food/route.ts
import { analyzeFood } from '@/lib/gemini'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30 // Увеличиваем таймаут для Vercel (обработка фото)

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const result = await analyzeFood(image)
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('analyze-food error:', error)
    return NextResponse.json({ error: error.message || 'Failed to analyze image' }, { status: 500 })
  }
}


Манифест PWA — src/app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Calorie AI Tracker',
    short_name: 'CalorieAI',
    description: 'Личный трекер питания и веса с ИИ-распознаванием еды',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a', // Тёмно-зеленый Tailwind (emerald-600)
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
}


📉 8. Браузерная утилита сжатия — src/lib/compress-image.ts
export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const MAX_SIDE = 800 // Оптимально для Gemini
      let { width, height } = img

      if (width > height && width > MAX_SIDE) {
        height = (height * MAX_SIDE) / width
        width = MAX_SIDE
      } else if (height > MAX_SIDE) {
        width = (width * MAX_SIDE) / height
        height = MAX_SIDE
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Конвертируем в JPEG с качеством 80%
      const base64 = canvas.toDataURL('image/jpeg', 0.8)
      
      // Отсекаем заголовок "data:image/jpeg;base64,"
      const rawBase64 = base64.split(',')[1]
      
      resolve(rawBase64)
      URL.revokeObjectURL(url)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}


📅 9. Пошаговый план спринта (5 дней)
День 1: Инфраструктурный фундамент
Инициализация Next.js: npx create-next-app@latest calorie-ai --ts --tailwind --app --src-dir --eslint
Зависимости: npm install @supabase/supabase-js lucide-react
Накат SQL таблиц и инициализация дефолтной строки настроек в дашборде Supabase.
Создание файлов конфигурации .env.local и папки src/lib/.
Настройка главной страницы src/app/page.tsx на чтение пустых данных. Первая проверка деплоя на Vercel.
День 2: Ядро бизнес-логики (Ручной учет)
Создание компонента MacroSummary.tsx для отображения прогресса дня.
Создание формы AddMealForm.tsx (Название, КБЖУ, выбор meal_type и времени).
Реализация функций addMeal и deleteMeal для мгновенного обновления интерфейса.
День 3: Интеграция с ИИ интеллектом
Добавление утилиты compress-image.ts.
Создание компонента CameraUpload.tsx с использованием нативного тега <input type="file" accept="image/*" capture="environment" />.
Тестирование сквозного сценария: Камера телефона ➔ Сжатие ➔ API-route ➔ Gemini ➔ Возврат JSON на экран.
Добавление PortionSelector.tsx для коррекции веса полученного блюда.
День 4: Редактирование записей и Архивы
Модификация карточки MealCard.tsx: добавление инлайнового редактирования полей.
Реализация страницы /history с календарем для просмотра прошлых дней.
День 5: Мониторинг веса и финализация PWA
Верстка экрана /weight для фиксации веса и просмотра динамики.
Создание страницы /settings для изменения глобальных целей КБЖУ.
Генерация иконки PWA, проверка работы приложения в режиме "Добавить на экран домой" на мобильном устройстве.
Когда будете готовы начать разработку первого дня — пишите, создадим проект и начнем разворачивать код по цепочке!


