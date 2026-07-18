import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetUser, mockFrom, mockUpsert, mockUpdate } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const response = { select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: 'product-1', name: 'Гречка', energy_100g: 104, proteins_100g: 3.5, fat_100g: 1, carbs_100g: 20, source: 'ai', base_product_id: null }, error: null }) })) };
  const mockUpsert = vi.fn(() => response);
  const mockUpdate = vi.fn(() => ({ eq: vi.fn(() => response) }));
  const mockFrom = vi.fn(() => ({ upsert: mockUpsert, update: mockUpdate }));
  return { mockGetUser, mockFrom, mockUpsert, mockUpdate };
});

vi.mock('@/lib/supabase-server', () => ({
  getServerClient: vi.fn(async () => ({ auth: { getUser: mockGetUser }, from: mockFrom })),
}));

import { POST } from '@/app/api/products/personal/route';

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/products/personal', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/products/personal', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockClear(); mockUpsert.mockClear(); mockUpdate.mockClear();
  });

  it('upserts an AI product by the normalized name instead of inserting a duplicate', async () => {
    const response = await POST(request({ name: '  ГРЕЧКА  ', calories: 104, protein: 3.5, fat: 1, carbs: 20, source: 'ai' }));

    expect(response.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1', name: 'ГРЕЧКА', name_key: 'гречка', source: 'ai',
    }), { onConflict: 'user_id,name_key' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
