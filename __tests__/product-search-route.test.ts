import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetUser, mockFrom, productsIlike, personalIlike, productsPattern, personalPattern, mockUpsert } = vi.hoisted(() => {
  const productsIlike = vi.fn();
  const personalIlike = vi.fn();
  const productsPattern = vi.fn();
  const personalPattern = vi.fn();
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      ilike: vi.fn((column: string, pattern: string) => {
        (table === 'products' ? productsPattern : personalPattern)(column, pattern);
        return ({
        limit: vi.fn(() => table === 'products' ? productsIlike() : personalIlike()),
        });
      }),
    })),
    upsert: mockUpsert,
  }));
  return { mockGetUser, mockFrom, productsIlike, personalIlike, productsPattern, personalPattern, mockUpsert };
});

vi.mock('@/lib/supabase-server', () => ({
  getServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: mockFrom })),
}));

import { GET, productSearchQuery } from '@/app/api/products/search/route';

function request(query: string) {
  return new NextRequest(`http://localhost/api/products/search?q=${encodeURIComponent(query)}`);
}

describe('GET /api/products/search', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockClear(); mockUpsert.mockClear(); productsPattern.mockClear(); personalPattern.mockClear();
    productsIlike.mockReset(); personalIlike.mockReset();
    vi.unstubAllGlobals();
  });

  it('returns a local match without calling Open Food Facts', async () => {
    productsIlike.mockResolvedValue({ data: [{ id: '111', name: 'Milk', energy_100g: 60, proteins_100g: 3, fat_100g: 3, carbs_100g: 5, source: 'openfoodfacts' }], error: null });
    personalIlike.mockResolvedValue({ data: [], error: null });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request('milk'));
    const body = await response.json();

    expect(body.source).toBe('local');
    expect(body.products[0]).toMatchObject({ name: 'Milk', calories: 60 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('removes a spoken serving amount before querying the catalogue', async () => {
    productsIlike.mockResolvedValue({ data: [], error: null });
    personalIlike.mockResolvedValue({ data: [], error: null });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ products: [] }) }));

    await GET(request('гречка 100 грамм'));

    expect(productSearchQuery('гречка 100 грамм')).toBe('гречка');
    expect(productsPattern).toHaveBeenCalledWith('name', '%гречка%');
    expect(personalPattern).toHaveBeenCalledWith('name', '%гречка%');
  });

  it('caches an Open Food Facts result when the local catalogue misses', async () => {
    productsIlike.mockResolvedValue({ data: [], error: null });
    personalIlike.mockResolvedValue({ data: [], error: null });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ products: [{ code: '222', product_name: 'Oat milk', nutriments: { 'energy-kcal_100g': 45, proteins_100g: 1, fat_100g: 2, carbohydrates_100g: 7 } }] }) }));

    const response = await GET(request('oat cache test'));
    const body = await response.json();

    expect(body.source).toBe('off');
    expect(body.products[0]).toMatchObject({ id: '222', name: 'Oat milk', calories: 45 });
    expect(mockUpsert).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: '222' })]), { onConflict: 'id' });
  });
});
