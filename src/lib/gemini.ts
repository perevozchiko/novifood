import type { FoodAnalysis } from '@/types';

/*
  Server-only Gemini integration.

  Called exclusively from the /api/analyze-food route so that
  GEMINI_API_KEY never reaches the browser bundle.

  Models are tried in order. If a model returns 429 (quota exhausted)
  the next model is attempted automatically — each model has its own
  independent free-tier quota on Google AI Studio.
*/

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function geminiHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
  // Auth keys (AQ.…) require the header; legacy AIza keys work with both.
    'x-goog-api-key': apiKey,
  };
}

/*
  Fallback chain: primary model first, then progressively lighter models.
  Each has a separate RPM / RPD quota so a 429 on one does not affect others.
  Lite models are listed first — they have their own free-tier quota and respond faster.
*/
const MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
] as const;

/** Per-model fetch timeout — keeps the fallback chain within Vercel's 30s limit. */
const PER_REQUEST_TIMEOUT_MS = 5_000;

/** Total wall-clock budget for trying all models in one API call. */
const TOTAL_DEADLINE_MS = 12_000;

/** Stop after this many free-tier quota hits — further models are likely exhausted too. */
const MAX_FREE_TIER_ATTEMPTS = 2;

/** Stop after this many 503 responses — models are overloaded cluster-wide. */
const MAX_UNAVAILABLE_ATTEMPTS = 2;

const IMAGE_PROMPT = `Analyse the food in this photo.
Respond ONLY with a valid JSON object. Do not include markdown codeblocks, wrapping, or explanations.
Structure:
{"name":"Dish Name in Russian","calories":0,"protein":0,"fat":0,"carbs":0}
All macro values must be integers representing the full portion visible in the photo.
Calories in kcal, protein/fat/carbs in grams.`;

const TEXT_PROMPT_PREFIX = `You are a specialized API module for a calorie tracker. Your only job is to parse the user's food description and return macronutrients (calories, protein, fat, carbs).

PRODUCT INTERPRETATION RULES:
1. Grains, pasta, and legumes:
   - If the user mentions a dish that is normally eaten cooked (e.g. "buckwheat porridge", "buckwheat", "rice", "oatmeal", "pasta") with words like "porridge", "cooked", "boiled", "prepared", OR gives only the dish name without specifying "dry" or "raw", you MUST use nutritional values for the COOKED product.
   - Example: "buckwheat porridge", "buckwheat" → ~100–110 kcal per 100 g.
   - Use dry/raw values ONLY when the user explicitly says "dry", "raw", or "uncooked grain" (e.g. "dry buckwheat", "buckwheat groats") → ~330–340 kcal per 100 g.
2. Meat and fish:
   - Unless stated otherwise, assume the product is cooked (baked, fried, grilled, etc.).
   - If the user explicitly says "raw", use raw nutritional values.

ROUNDING:
- Calories: round to the nearest whole number (integer).
- Protein, fat, carbs: round to 1 decimal place.

Respond ONLY with a valid JSON object. Do not include markdown, code fences, or explanations.
Structure:
{"name":"Dish name in Russian","calories":0,"protein":0.0,"fat":0.0,"carbs":0.0}
All values must reflect the portion described by the user (use stated weight/volume when given).
Calories in kcal; protein, fat, and carbs in grams.

User input: `;

/*
  Structured error that carries an HTTP status and an optional machine-readable
  code so the API route can forward the right status and code to the client
  without exposing Gemini internals.
*/
export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/* Extract a short human-readable message from a Gemini error response body. */
function parseRetrySeconds(raw: string): number | null {
  const match = raw.match(/retry in ([\d.]+)s/i);
  if (!match) return null;
  const seconds = Math.ceil(Number(match[1]));
  return Number.isFinite(seconds) ? seconds : null;
}

function isFreeTierQuotaZero(body: string, raw: string): boolean {
  return raw.includes('limit: 0') && /free_tier|FreeTier/i.test(body);
}

function parseGeminiError(status: number, body: string, model: string): GeminiError {
  // Log the full body on the server so developers can inspect it.
  console.error(`Gemini API error [${model}] ${status}:`, body);

  try {
    const json = JSON.parse(body) as { error?: { message?: string; status?: string } };
    const raw = json.error?.message ?? '';
    const retrySeconds = parseRetrySeconds(raw);

    if (status === 429) {
      /*
        "limit: 0" without a model name usually means the Cloud project has no
        quota at all (wrong key source or billing not set up).
        "limit: 0, model: …" with free_tier metrics means this model's free
        quota is exhausted — try one more model, then fail fast.
      */
      if (raw.includes('limit: 0') && !/model:\s*[\w.-]+/i.test(raw)) {
        return new GeminiError(
          'Gemini API not configured: quota is 0. ' +
          'Create a new API key at aistudio.google.com/apikey and update GEMINI_API_KEY in your deployment.',
          500,
          'NOT_CONFIGURED',
        );
      }

      if (isFreeTierQuotaZero(body, raw)) {
        const waitHint = retrySeconds ? ` Try again in ~${retrySeconds}s.` : '';
        return new GeminiError(
          `AI free-tier quota exhausted.${waitHint}`,
          429,
          'FREE_TIER_EXHAUSTED',
        );
      }

      const waitHint = retrySeconds ? ` Try again in ~${retrySeconds}s.` : '';
      return new GeminiError(`AI quota exceeded.${waitHint}`, 429, 'GEMINI_QUOTA');
    }

    if (status === 503) {
      return new GeminiError(
        'AI models are temporarily overloaded. Please try again in a few minutes.',
        503,
        'GEMINI_UNAVAILABLE',
      );
    }

    if (status === 401 || status === 403) {
      return new GeminiError('Invalid or missing Gemini API key.', status);
    }

    // Extract first sentence of the Gemini message to avoid dumping the whole blob.
    const short = raw.split('\n')[0].slice(0, 120) || `Gemini error ${status}`;
    return new GeminiError(short, status);
  } catch {
    return new GeminiError(`Gemini error ${status}`, status);
  }
}

/* Extract text from a generateContent response or throw a structured error. */
function extractResponseText(result: unknown, model: string): string {
  const candidates = (result as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    ?.candidates;
  const text = candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error(`Gemini empty response [${model}]:`, JSON.stringify(result).slice(0, 500));
    throw new GeminiError('Gemini returned an empty response.', 502, 'EMPTY_RESPONSE');
  }

  return text;
}

/* Send a base64-encoded JPEG to a specific model and parse the macro response. */
async function tryModel(
  apiKey: string,
  model: string,
  base64Image: string,
  timeoutMs: number,
): Promise<FoodAnalysis> {
  const url = `${BASE_URL}/${model}:generateContent`;

  const response = await fetchGemini(
    url,
    {
      method: 'POST',
      headers: geminiHeaders(apiKey),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
              { text: IMAGE_PROMPT },
            ],
          },
        ],
      }),
    },
    timeoutMs,
  );

  if (!response.ok) {
    const errText = await response.text();
    throw parseGeminiError(response.status, errText, model);
  }

  const result = await response.json();
  const text = extractResponseText(result, model);

  // Strip accidental markdown fences that some model versions include.
  const cleanJson = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson) as FoodAnalysis;
}

/*
  HTTP status codes from Gemini that mean this specific model is unavailable
  but a different model in the chain might succeed.
  - 429: quota exhausted for this model
  - 404: model not found / not available in this region or account tier
  - 503: model temporarily unavailable
*/
const RETRYABLE_STATUSES = new Set([429, 404, 503]);

async function fetchGemini(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GeminiError(`Gemini request timed out after ${timeoutMs}ms.`, 504, 'TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/*
  Run model fallback with a total deadline so Vercel serverless functions
  do not hit the 30s platform timeout when every model returns 429.
*/
async function withModelFallback<T>(
  label: string,
  tryModel: (model: string, timeoutMs: number) => Promise<T>,
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError('GEMINI_API_KEY is not configured.', 500, 'NOT_CONFIGURED');

  console.info(`${label}: key=${apiKey.slice(0, 6)}… len=${apiKey.length}`);

  const deadline = Date.now() + TOTAL_DEADLINE_MS;
  let lastError: GeminiError | null = null;
  let freeTierHits = 0;
  let unavailableHits = 0;

  for (const model of MODELS) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      console.warn(`${label}: total deadline reached, stopping model fallback`);
      break;
    }

    const timeoutMs = Math.min(PER_REQUEST_TIMEOUT_MS, remaining);

    try {
      return await tryModel(model, timeoutMs);
    } catch (err) {
      if (err instanceof GeminiError && err.code === 'NOT_CONFIGURED') {
        throw err;
      }

      if (err instanceof GeminiError && err.code === 'FREE_TIER_EXHAUSTED') {
        freeTierHits++;
        lastError = err;
        console.warn(`Model ${model} free-tier quota exhausted (${freeTierHits}/${MAX_FREE_TIER_ATTEMPTS})`);
        if (freeTierHits >= MAX_FREE_TIER_ATTEMPTS) {
          throw new GeminiError(
            'AI free-tier quota exhausted for all available models. Wait a minute and try again, or enable billing in Google AI Studio.',
            429,
            'GEMINI_QUOTA',
          );
        }
        continue;
      }

      if (err instanceof GeminiError && err.code === 'GEMINI_UNAVAILABLE') {
        unavailableHits++;
        lastError = err;
        console.warn(`Model ${model} overloaded (${unavailableHits}/${MAX_UNAVAILABLE_ATTEMPTS})`);
        if (unavailableHits >= MAX_UNAVAILABLE_ATTEMPTS) {
          throw err;
        }
        continue;
      }

      if (err instanceof GeminiError && (RETRYABLE_STATUSES.has(err.status) || err.code === 'TIMEOUT')) {
        console.warn(`Model ${model} unavailable (${err.status}${err.code ? `/${err.code}` : ''}), trying next model…`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new GeminiError('All AI models are currently unavailable.', 429, 'GEMINI_QUOTA');
}

/*
  Send a base64-encoded JPEG to Gemini and parse the macro response.
  Tries each model in MODELS order; skips to the next on model-specific failures.
  Account-level errors (NOT_CONFIGURED, 401, 403) are thrown immediately.
*/
export async function analyzeFood(base64Image: string): Promise<FoodAnalysis> {
  return withModelFallback('analyzeFood', (model, timeoutMs) => {
    const apiKey = process.env.GEMINI_API_KEY!;
    return tryModel(apiKey, model, base64Image, timeoutMs);
  });
}

/* Send a text description to a specific model and parse the macro response. */
async function tryModelText(
  apiKey: string,
  model: string,
  userText: string,
  timeoutMs: number,
): Promise<FoodAnalysis> {
  const url = `${BASE_URL}/${model}:generateContent`;

  const response = await fetchGemini(
    url,
    {
      method: 'POST',
      headers: geminiHeaders(apiKey),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: TEXT_PROMPT_PREFIX + userText },
            ],
          },
        ],
      }),
    },
    timeoutMs,
  );

  if (!response.ok) {
    const errText = await response.text();
    throw parseGeminiError(response.status, errText, model);
  }

  const result = await response.json();
  const text = extractResponseText(result, model);

  const cleanJson = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson) as FoodAnalysis;
}

/*
  Send a natural-language food description to Gemini and parse the macro response.
  Uses the same model fallback chain as analyzeFood.
*/
export async function analyzeFoodText(userText: string): Promise<FoodAnalysis> {
  return withModelFallback('analyzeFoodText', (model, timeoutMs) => {
    const apiKey = process.env.GEMINI_API_KEY!;
    return tryModelText(apiKey, model, userText, timeoutMs);
  });
}

function transcribePrompt(locale: 'en' | 'ru'): string {
  const language = locale === 'en' ? 'English' : 'Russian';
  return `Transcribe the spoken audio verbatim in ${language}.
The speaker is describing food or a meal.
Return ONLY the transcript text — no quotes, labels, markdown, or explanations.`;
}

async function tryModelTranscribe(
  apiKey: string,
  model: string,
  base64Audio: string,
  mimeType: string,
  locale: 'en' | 'ru',
  timeoutMs: number,
): Promise<string> {
  const url = `${BASE_URL}/${model}:generateContent`;

  const response = await fetchGemini(
    url,
    {
      method: 'POST',
      headers: geminiHeaders(apiKey),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Audio } },
              { text: transcribePrompt(locale) },
            ],
          },
        ],
      }),
    },
    timeoutMs,
  );

  if (!response.ok) {
    const errText = await response.text();
    throw parseGeminiError(response.status, errText, model);
  }

  const result = await response.json();
  const text = extractResponseText(result, model).trim();
  if (!text) {
    throw new GeminiError('No speech detected in audio.', 422, 'NO_SPEECH');
  }
  return text;
}

/*
  Transcribe a short voice recording via Gemini.
  Used instead of the browser Web Speech API so we can pin the Mac built-in mic.
*/
export async function transcribeSpeechAudio(
  base64Audio: string,
  mimeType: string,
  locale: 'en' | 'ru',
): Promise<string> {
  return withModelFallback('transcribeSpeechAudio', (model, timeoutMs) => {
    const apiKey = process.env.GEMINI_API_KEY!;
    return tryModelTranscribe(apiKey, model, base64Audio, mimeType, locale, timeoutMs);
  });
}
