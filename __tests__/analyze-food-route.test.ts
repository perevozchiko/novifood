import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockAnalyzeFood, mockMaybeSingle, mockUpsert, mockFrom, mockGetUser } = vi.hoisted(() => {
  const mockAnalyzeFood = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
      })),
    })),
    upsert: mockUpsert,
  }));

  return { mockAnalyzeFood, mockMaybeSingle, mockUpsert, mockFrom, mockGetUser };
});

vi.mock('@/lib/gemini', () => ({
  analyzeFood: mockAnalyzeFood,
  GeminiError: class GeminiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly code?: string,
    ) {
      super(message);
      this.name = 'GeminiError';
    }
  },
}));

vi.mock('@/lib/supabase-server', () => ({
  getServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { POST } from '@/app/api/analyze-food/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/analyze-food', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze-food', () => {
  beforeEach(() => {
    mockAnalyzeFood.mockReset();
    mockMaybeSingle.mockReset();
    mockUpsert.mockClear();
    mockFrom.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockMaybeSingle.mockResolvedValue({ data: { count: 0 }, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('POST_ShouldReturn400_WhenImageMissing', async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('No image provided');
    expect(mockAnalyzeFood).not.toHaveBeenCalled();
  });

  it('POST_ShouldReturnGeminiResult_WhenAnalysisSucceeds', async () => {
    mockAnalyzeFood.mockResolvedValue({
      name: 'Овсянка',
      calories: 300,
      protein: 10,
      fat: 6,
      carbs: 54,
    });

    const res = await POST(makeRequest({ image: 'base64jpeg' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      name: 'Овсянка',
      calories: 300,
      protein: 10,
      fat: 6,
      carbs: 54,
    });
    expect(mockAnalyzeFood).toHaveBeenCalledWith('base64jpeg');
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  it('POST_ShouldReturn429_WhenDailyLimitReached', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { count: 50 }, error: null });

    const res = await POST(makeRequest({ image: 'base64jpeg' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('DAILY_LIMIT');
    expect(mockAnalyzeFood).not.toHaveBeenCalled();
  });

  it('POST_ShouldForwardGeminiError_WhenGeminiFails', async () => {
    const { GeminiError } = await import('@/lib/gemini');
    mockAnalyzeFood.mockRejectedValue(
      new GeminiError('Invalid or missing Gemini API key.', 403),
    );

    const res = await POST(makeRequest({ image: 'base64jpeg' }));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain('API key');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('POST_ShouldNotIncrementUsage_WhenGeminiFails', async () => {
    mockAnalyzeFood.mockRejectedValue(new Error('network down'));

    const res = await POST(makeRequest({ image: 'base64jpeg' }));

    expect(res.status).toBe(500);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
