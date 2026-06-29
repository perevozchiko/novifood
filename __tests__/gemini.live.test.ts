import { afterAll, describe, expect, it } from 'vitest';
import { analyzeFoodText } from '@/lib/gemini';

/*
  Optional live integration test — hits the real Gemini API.

  Run locally (never in CI without a secret):
    RUN_GEMINI_LIVE_TESTS=1 npm test -- gemini.live

  Requires GEMINI_API_KEY in the environment (.env.local is NOT loaded automatically).
*/

const runLive = process.env.RUN_GEMINI_LIVE_TESTS === '1' && !!process.env.GEMINI_API_KEY;

describe.skipIf(!runLive)('gemini live integration', () => {
  afterAll(() => {
    // Vitest may cache modules; nothing to tear down for fetch.
  });

  it('analyzeFoodText_ShouldReturnMacros_WhenLiveKeyConfigured', async () => {
    const result = await analyzeFoodText('банан примерно 120 грамм');

    expect(result.name).toBeTruthy();
    expect(result.calories).toBeGreaterThan(0);
    expect(result.protein).toBeGreaterThanOrEqual(0);
    expect(result.fat).toBeGreaterThanOrEqual(0);
    expect(result.carbs).toBeGreaterThanOrEqual(0);
  }, 30_000);
});
