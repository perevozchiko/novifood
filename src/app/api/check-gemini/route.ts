import { NextResponse } from 'next/server';

/*
  Diagnostic endpoint — validates GEMINI_API_KEY without consuming generative quota.

  Visit /api/check-gemini after deployment to verify the key is loaded and accepted
  by the Gemini API.  Returns JSON with key metadata and available models list.

  Not accessible from the browser client bundle (server route only).
*/

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        status: 'error',
        issue: 'GEMINI_API_KEY is not set',
        hint: 'Add GEMINI_API_KEY to Vercel → Project Settings → Environment Variables, then redeploy.',
      },
      { status: 500 },
    );
  }

  // Google AI Studio issues two key formats:
  // - Legacy standard keys: AIzaSy… (~39 chars)
  // - Auth keys (default since 2026): AQ.Ab… (~50+ chars)
  const isLegacyKey = apiKey.startsWith('AIza') && apiKey.length >= 35;
  const isAuthKey = apiKey.startsWith('AQ.') && apiKey.length >= 40;

  const keyInfo = {
    prefix: apiKey.slice(0, 6) + '…',
    length: apiKey.length,
    keyType: isAuthKey ? 'auth' : isLegacyKey ? 'standard' : 'unknown',
    looksValid: isLegacyKey || isAuthKey,
  };

  if (!keyInfo.looksValid) {
    return NextResponse.json(
      {
        status: 'error',
        issue: 'Key format looks wrong (expected "AIza…" or "AQ.…")',
        keyInfo,
        hint: 'Go to aistudio.google.com/apikey, create a new key, and copy the full value.',
      },
      { status: 500 },
    );
  }

  // models.list is a read-only call — does not consume generative quota.
  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models',
      { headers: { 'x-goog-api-key': apiKey } },
    );

    if (!res.ok) {
      const body = await res.text();
      let hint = 'Unexpected error from Gemini API.';
      if (res.status === 400) hint = 'Bad request — the key may be malformed.';
      if (res.status === 401 || res.status === 403) {
        hint = 'Key is invalid or was deleted. Create a new key at aistudio.google.com/apikey.';
      }
      return NextResponse.json(
        {
          status: 'error',
          issue: `Gemini API returned HTTP ${res.status}`,
          detail: body.slice(0, 300),
          keyInfo,
          hint,
        },
        { status: 500 },
      );
    }

    const data = await res.json() as { models?: Array<{ name: string }> };
    const models = (data.models ?? []).map((m) => m.name);
    const hasFlash = models.some((n) => n.includes('flash'));

    return NextResponse.json({
      status: 'ok',
      keyInfo,
      availableModels: models,
      hasFlash,
      hint: hasFlash
        ? 'Key is valid and flash models are available. AI recognition should work.'
        : 'Key is valid but no flash models found — check your Google Cloud project quota settings.',
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        issue: 'Could not reach generativelanguage.googleapis.com',
        detail: err instanceof Error ? err.message : String(err),
        keyInfo,
        hint: 'Check network access from your deployment environment.',
      },
      { status: 500 },
    );
  }
}
