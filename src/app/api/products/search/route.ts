import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';
import { asNonNegativeNumber } from '@/lib/product-nutrition';
import type { Product } from '@/types';

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const CACHE_TTL_MS = 5 * 60_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;
const offResultCache = new Map<string, { expiresAt: number; products: Product[] }>();
const requestTimes = new Map<string, number[]>();

type ProductRow = {
  id: string;
  name: string;
  energy_100g: number | null;
  proteins_100g: number | null;
  fat_100g: number | null;
  carbs_100g: number | null;
  source?: string | null;
};

type UserProductRow = ProductRow & { base_product_id: string | null };

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

/**
 * Speech input often includes a serving amount (for example, "гречка 100 г").
 * A catalogue stores product names rather than full spoken phrases, so remove
 * a trailing measurement before querying it.
 */
export function productSearchQuery(query: string): string {
  const withoutServing = query
    .replace(/\s+\d+(?:[.,]\d+)?\s*(?:г(?:р(?:ам(?:м(?:а|ов)?)?)?)?|кг|мг|g|kg|mg|мл|л|ml|l)\.?\s*$/iu, '')
    .trim();
  return withoutServing.length >= 2 ? withoutServing : query;
}

function fromCacheRow(row: ProductRow, personal = false, baseProductId: string | null = null): Product {
  return {
    id: row.id,
    barcode: personal ? null : row.id,
    name: row.name,
    calories: asNonNegativeNumber(row.energy_100g),
    protein: asNonNegativeNumber(row.proteins_100g),
    fat: asNonNegativeNumber(row.fat_100g),
    carbs: asNonNegativeNumber(row.carbs_100g),
    source: personal ? (row.source === 'ai' ? 'ai' : 'manual') : 'openfoodfacts',
    baseProductId,
    isPersonal: personal,
  };
}

function canCallOff(key: string): boolean {
  const now = Date.now();
  const recent = (requestTimes.get(key) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    requestTimes.set(key, recent);
    return false;
  }
  requestTimes.set(key, [...recent, now]);
  return true;
}

function energyKcal(nutriments: Record<string, unknown>): number {
  const kcal = asNonNegativeNumber(nutriments['energy-kcal_100g'] ?? nutriments.energy_kcal_100g);
  if (kcal > 0) return kcal;
  const kilojoules = asNonNegativeNumber(nutriments.energy_100g);
  return kilojoules > 0 ? Math.round((kilojoules / 4.184) * 10) / 10 : 0;
}

async function searchOpenFoodFacts(query: string): Promise<Product[]> {
  const cached = offResultCache.get(query);
  if (cached && cached.expiresAt > Date.now()) return cached.products;

  const url = new URL(OFF_SEARCH_URL);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '10');
  url.searchParams.set('fields', 'code,product_name,product_name_en,nutriments');

  const response = await fetch(url, {
    headers: {
      'User-Agent': process.env.OPEN_FOOD_FACTS_USER_AGENT ?? 'NoviFood/0.1 (Open Food Facts cache; contact: support@novifood.app)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(7_000),
  });
  if (!response.ok) throw new Error(`Open Food Facts returned ${response.status}`);

  const payload = await response.json() as {
    products?: Array<{ code?: string; product_name?: string; product_name_en?: string; nutriments?: Record<string, unknown> }>;
  };
  const products = (payload.products ?? []).flatMap((item): Product[] => {
    const barcode = item.code?.trim();
    const name = item.product_name?.trim() || item.product_name_en?.trim();
    if (!barcode || !name) return [];
    const nutriments = item.nutriments ?? {};
    return [{
      id: barcode,
      barcode,
      name,
      calories: energyKcal(nutriments),
      protein: asNonNegativeNumber(nutriments.proteins_100g),
      fat: asNonNegativeNumber(nutriments.fat_100g),
      carbs: asNonNegativeNumber(nutriments.carbohydrates_100g),
      source: 'openfoodfacts',
      baseProductId: null,
      isPersonal: false,
    }];
  });
  offResultCache.set(query, { expiresAt: Date.now() + CACHE_TTL_MS, products });
  return products;
}

async function cacheOffProducts(products: Product[]) {
  if (products.length === 0) return;
  const supabase = await getServerClient();
  const { error } = await supabase.from('products').upsert(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      energy_100g: product.calories,
      proteins_100g: product.protein,
      fat_100g: product.fat,
      carbs_100g: product.carbs,
      source: 'openfoodfacts',
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'id' },
  );
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) return NextResponse.json({ products: [], source: 'local' });
  const searchQuery = productSearchQuery(query);

  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pattern = `%${escapeLike(searchQuery)}%`;
  const [cached, personal] = await Promise.all([
    supabase.from('products').select('id,name,energy_100g,proteins_100g,fat_100g,carbs_100g,source').ilike('name', pattern).limit(12),
    supabase.from('user_products').select('id,name,energy_100g,proteins_100g,fat_100g,carbs_100g,source,base_product_id').ilike('name', pattern).limit(12),
  ]);
  if (cached.error || personal.error) {
    return NextResponse.json({ error: 'Unable to search local products' }, { status: 500 });
  }

  const personalProducts = ((personal.data ?? []) as UserProductRow[])
    .map((row) => fromCacheRow(row, true, row.base_product_id));
  const overridden = new Set(personalProducts.map((product) => product.baseProductId).filter(Boolean));
  const cachedProducts = ((cached.data ?? []) as ProductRow[])
    .filter((row) => !overridden.has(row.id))
    .map((row) => fromCacheRow(row));
  const local = [...personalProducts, ...cachedProducts].slice(0, 12);
  if (local.length > 0) return NextResponse.json({ products: local, source: 'local' });

  const clientKey = user.id;
  if (!canCallOff(clientKey)) return NextResponse.json({ products: [], source: 'none', limited: true });
  try {
    const offProducts = await searchOpenFoodFacts(searchQuery);
    await cacheOffProducts(offProducts);
    return NextResponse.json({ products: offProducts, source: offProducts.length ? 'off' : 'none' });
  } catch (error) {
    console.warn('Open Food Facts search failed:', error);
    return NextResponse.json({ products: [], source: 'none' });
  }
}
