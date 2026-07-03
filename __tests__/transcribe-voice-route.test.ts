import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockTranscribeSpeechAudio, mockMaybeSingle, mockUpsert, mockFrom, mockGetUser } = vi.hoisted(() => {
  const mockTranscribeSpeechAudio = vi.fn();
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

  return { mockTranscribeSpeechAudio, mockMaybeSingle, mockUpsert, mockFrom, mockGetUser };
});

vi.mock('@/lib/gemini', () => ({
  transcribeSpeechAudio: mockTranscribeSpeechAudio,
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

import { POST } from '@/app/api/transcribe-voice/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/transcribe-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/transcribe-voice', () => {
  beforeEach(() => {
    mockTranscribeSpeechAudio.mockReset();
    mockMaybeSingle.mockReset();
    mockUpsert.mockClear();
    mockFrom.mockClear();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockMaybeSingle.mockResolvedValue({ data: { count: 0 }, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('POST_ShouldReturn400_WhenAudioMissing', async () => {
    const res = await POST(makeRequest({ mimeType: 'audio/webm', locale: 'ru' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('No audio provided');
    expect(mockTranscribeSpeechAudio).not.toHaveBeenCalled();
  });

  it('POST_ShouldReturnTranscript_WhenTranscriptionSucceeds', async () => {
    mockTranscribeSpeechAudio.mockResolvedValue('стакан молока 330 грамм');

    const res = await POST(makeRequest({
      audio: 'dGVzdA==',
      mimeType: 'audio/webm',
      locale: 'ru',
    }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.transcript).toBe('стакан молока 330 грамм');
    expect(mockTranscribeSpeechAudio).toHaveBeenCalledWith('dGVzdA==', 'audio/webm', 'ru');
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});
