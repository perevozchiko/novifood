import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeFood, analyzeFoodText, GeminiError } from '@/lib/gemini';

const API_KEY = 'AIzaSyTestKeyForUnitTests1234567890';

function geminiJsonResponse(text: string) {
  return {
    candidates: [{ content: { parts: [{ text }] } }],
  };
}

function mockFetchSequence(
  ...responses: Array<{ status: number; body: unknown }>
) {
  const fetchMock = vi.fn();
  for (const { status, body } of responses) {
    fetchMock.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
      json: async () => body,
    });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('analyzeFoodText', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', API_KEY);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('analyzeFoodText_ShouldSendGeminiRequest_WhenTextProvided', async () => {
    const fetchMock = mockFetchSequence({
      status: 200,
      body: geminiJsonResponse(
        '{"name":"Банан","portionGrams":120,"calories":89,"protein":1,"fat":0,"carbs":23}',
      ),
    });

    const result = await analyzeFoodText('банан 120 грамм');

    expect(result).toEqual({
      name: 'Банан',
      portionGrams: 120,
      calories: 89,
      protein: 1,
      fat: 0,
      carbs: 23,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('gemini-2.0-flash-lite:generateContent');
    expect(url).not.toContain('key=');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(API_KEY);

    const payload = JSON.parse(init.body as string) as {
      contents: Array<{ parts: Array<{ text?: string }> }>;
    };
    expect(payload.contents[0].parts[0].text).toContain('банан 120 грамм');
    expect(payload.contents[0].parts[0].text).toContain('calorie tracker');
    expect(payload.contents[0].parts[0].text).toContain('COOKED product');
  });

  it('analyzeFoodText_ShouldStripMarkdownFences_WhenModelWrapsJson', async () => {
    mockFetchSequence({
      status: 200,
      body: geminiJsonResponse(
        '```json\n{"name":"Йогурт","calories":180,"protein":12,"fat":8,"carbs":15}\n```',
      ),
    });

    const result = await analyzeFoodText('йогурт 4% 330 грамм');

    expect(result.name).toBe('Йогурт');
    expect(result.calories).toBe(180);
  });

  it('analyzeFoodText_ShouldThrowNotConfigured_WhenApiKeyMissing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');

    await expect(analyzeFoodText('банан')).rejects.toMatchObject({
      message: 'GEMINI_API_KEY is not configured.',
      status: 500,
      code: 'NOT_CONFIGURED',
    });
  });

  it('analyzeFoodText_ShouldTryNextModel_WhenFirstModelReturns429', async () => {
    const fetchMock = mockFetchSequence(
      {
        status: 429,
        body: { error: { message: 'Quota exceeded for model' } },
      },
      {
        status: 200,
        body: geminiJsonResponse(
          '{"name":"Яблоко","calories":95,"protein":0,"fat":0,"carbs":25}',
        ),
      },
    );

    const result = await analyzeFoodText('яблоко');

    expect(result.name).toBe('Яблоко');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('gemini-2.0-flash-lite');
    expect(fetchMock.mock.calls[1][0]).toContain('gemini-2.5-flash-lite');
  });

  it('analyzeFoodText_ShouldFailFast_WhenFreeTierQuotaZeroOnTwoModels', async () => {
    const quotaBody = {
      error: {
        message:
          'Quota exceeded limit: 0, model: gemini-2.0-flash-lite. Please retry in 30s.',
      },
    };
    const fetchMock = mockFetchSequence(
      { status: 429, body: JSON.stringify({ ...quotaBody, details: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] }) },
      { status: 429, body: JSON.stringify({ ...quotaBody, details: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] }) },
      {
        status: 200,
        body: geminiJsonResponse(
          '{"name":"Яблоко","calories":95,"protein":0,"fat":0,"carbs":25}',
        ),
      },
    );

    await expect(analyzeFoodText('яблоко')).rejects.toMatchObject({
      code: 'GEMINI_QUOTA',
      status: 429,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('analyzeFoodText_ShouldFailFast_WhenTwoModelsReturn503', async () => {
    const unavailable = {
      error: { message: 'This model is currently experiencing high demand.' },
    };
    const fetchMock = mockFetchSequence(
      { status: 503, body: unavailable },
      { status: 503, body: unavailable },
      {
        status: 200,
        body: geminiJsonResponse(
          '{"name":"Яблоко","calories":95,"protein":0,"fat":0,"carbs":25}',
        ),
      },
    );

    await expect(analyzeFoodText('яблоко')).rejects.toMatchObject({
      code: 'GEMINI_UNAVAILABLE',
      status: 503,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('analyzeFoodText_ShouldNotRetry_WhenQuotaIsZero', async () => {
    const fetchMock = mockFetchSequence({
      status: 429,
      body: { error: { message: 'limit: 0' } },
    });

    await expect(analyzeFoodText('банан')).rejects.toMatchObject({
      code: 'NOT_CONFIGURED',
      status: 500,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('analyzeFoodText_ShouldThrowEmptyResponse_WhenCandidatesMissing', async () => {
    mockFetchSequence({
      status: 200,
      body: { candidates: [] },
    });

    await expect(analyzeFoodText('банан')).rejects.toMatchObject({
      message: 'Gemini returned an empty response.',
      status: 502,
      code: 'EMPTY_RESPONSE',
    });
  });
});

describe('analyzeFood', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', API_KEY);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('analyzeFood_ShouldSendImageAndPrompt_WhenBase64Provided', async () => {
    const fetchMock = mockFetchSequence({
      status: 200,
      body: geminiJsonResponse(
        '{"name":"Салат","calories":250,"protein":8,"fat":18,"carbs":12}',
      ),
    });

    const result = await analyzeFood('dGVzdGltYWdl');

    expect(result.name).toBe('Салат');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      contents: Array<{ parts: Array<{ inline_data?: { mime_type: string; data: string }; text?: string }> }>;
    };
    const parts = payload.contents[0].parts;
    expect(parts[0].inline_data).toEqual({ mime_type: 'image/jpeg', data: 'dGVzdGltYWdl' });
    expect(parts[1].text).toContain('Analyse the food in this photo');
  });

  it('analyzeFood_ShouldThrowGeminiError_WhenApiReturns401', async () => {
    mockFetchSequence({
      status: 401,
      body: { error: { message: 'API key not valid' } },
    });

    const err = await analyzeFood('dGVzdA==').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GeminiError);
    expect((err as GeminiError).status).toBe(401);
  });
});
