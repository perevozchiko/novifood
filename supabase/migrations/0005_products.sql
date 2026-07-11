-- Migration 0005: Таблица продуктов для внешних данных (Open Food Facts)

-- Основные поля продукта
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,                -- Баркод/Штрих-код (можно использовать как внешний идентификатор)
  name TEXT NOT NULL,                 -- Название продукта
  energy_100g REAL,                     -- Энергия на 100 г (ккал)
  proteins_100g REAL,                 -- Белки на 100 г (г)
  fat_100g REAL,                      -- Жиры на 100 г (г)
  carbs_100g REAL,                    -- Углеводы на 100 г (г)
  source TEXT DEFAULT 'openfoodfacts', -- Источник данных
  created_at TIMESTAMP DEFAULT NOW()    -- Дата создания записи
);

-- Индекс для быстрого поиска без учёта регистра
CREATE UNIQUE INDEX idx_products_name_lower ON products (LOWER(name));

-- Индекс по штрих-коду (если он есть) для быстрого доступа
CREATE UNIQUE INDEX idx_products_barcode ON products (id);