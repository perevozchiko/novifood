import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockAnalyzeFoodText, mockMaybeSingle, mockUpsert, mockFrom, mockGetUser } = vi.hoisted(() => {
  const mockAnalyzeFoodText = vi.fn();
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

  return { mockAnalyzeFoodText, mockMaybeSingle, mockUpsert, mockFrom, mockGetUser };
});

vi.mock('@/lib/gemini', () => ({
  analyzeFoodText: mockAnalyzeFoodText,
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

import { POST } from '@/app/api/analyze-voice/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/analyze-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/analyze-voice', () => {
  beforeEach(() => {
    mockAnalyzeFoodText.mockReset();
    mockMaybeSingle.mockReset();
    mockUpsert.mockClear();
    mockFrom.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockMaybeSingle.mockResolvedValue({ data: { count: 0 }, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('POST_ShouldReturn400_WhenTextMissing', async () => {
    const res = await POST(makeRequest({ text: '   ' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('No text provided');
    expect(mockAnalyzeFoodText).not.toHaveBeenCalled();
  });

  it('POST_ShouldReturnGeminiResult_WhenTextAnalysisSucceeds', async () => {
    mockAnalyzeFoodText.mockResolvedValue({
      name: 'Йогурт 4%',
      calories: 180,
      protein: 12,
      fat: 8,
      carbs: 15,
    });

    const res = await POST(makeRequest({ text: 'Йогурт 4% 330 грамм' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe('Йогурт 4%');
    expect(mockAnalyzeFoodText).toHaveBeenCalledWith('Йогурт 4% 330 грамм');
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  it('POST_ShouldReturn429_WhenDailyLimitReached', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { count: 50 }, error: null });

    const res = await POST(makeRequest({ text: 'банан' }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.code).toBe('DAILY_LIMIT');
    expect(mockAnalyzeFoodText).not.toHaveBeenCalled();
  });

  it('POST_ShouldForwardEmptyResponseCode_WhenGeminiReturnsNoCandidates', async () => {
    const { GeminiError } = await import('@/lib/gemini');
    mockAnalyzeFoodText.mockRejectedValue(
      new GeminiError('Gemini returned an empty response.', 502, 'EMPTY_RESPONSE'),
    );

    const res = await POST(makeRequest({ text: 'банан' }));
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.code).toBe('EMPTY_RESPONSE');
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
