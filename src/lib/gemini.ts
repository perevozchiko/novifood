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

/*
  Fallback chain: primary model first, then progressively lighter models.
  Each has a separate RPM / RPD quota so a 429 on one does not affect others.
*/
const MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
] as const;

const IMAGE_PROMPT = `Analyse the food in this photo.
Respond ONLY with a valid JSON object. Do not include markdown codeblocks, wrapping, or explanations.
Structure:
{"name":"Dish Name in Russian","calories":0,"protein":0,"fat":0,"carbs":0}
All macro values must be integers representing the full portion visible in the photo.
Calories in kcal, protein/fat/carbs in grams.`;

const TEXT_PROMPT_PREFIX = `The user described a food item or meal in natural language.
Extract the nutritional information and respond ONLY with a valid JSON object.
Do not include markdown codeblocks, wrapping, or explanations.
Structure:
{"name":"Dish Name in Russian","calories":0,"protein":0,"fat":0,"carbs":0}
All macro values must be integers for the described portion.
Calories in kcal, protein/fat/carbs in grams.
If weight is mentioned (e.g. "330 grams"), use it for calculations.
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
function parseGeminiError(status: number, body: string, model: string): GeminiError {
  // Log the full body on the server so developers can inspect it.
  console.error(`Gemini API error [${model}] ${status}:`, body);

  try {
    const json = JSON.parse(body) as { error?: { message?: string; status?: string } };
    const raw = json.error?.message ?? '';

    if (status === 429) {
      /*
        "limit: 0" in the Gemini error message means the Google Cloud project
        has zero quota configured — this is a billing/setup issue, not exhaustion.
        Retrying or waiting will not help; the developer must:
          1. Create an API key via https://aistudio.google.com/apikey (not Cloud Console)
          2. Or enable billing on the Google Cloud project to unlock free-tier quota.
      */
      if (raw.includes('limit: 0')) {
        return new GeminiError(
          'Gemini API not configured: quota is 0. ' +
          'Create a new API key at aistudio.google.com/apikey and update GEMINI_API_KEY in your deployment.',
          500,
          'NOT_CONFIGURED',
        );
      }
      return new GeminiError('AI quota exceeded. Please try again later.', 429);
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

/* Send a base64-encoded JPEG to a specific model and parse the macro response. */
async function tryModel(apiKey: string, model: string, base64Image: string): Promise<FoodAnalysis> {
  const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  });

  if (!response.ok) {
    const errText = await response.text();
    throw parseGeminiError(response.status, errText, model);
  }

  const result = await response.json();
  const text: string = result.candidates[0].content.parts[0].text;

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

/*
  Send a base64-encoded JPEG to Gemini and parse the macro response.
  Tries each model in MODELS order; skips to the next on model-specific failures.
  Account-level errors (NOT_CONFIGURED, 401, 403) are thrown immediately.
*/
export async function analyzeFood(base64Image: string): Promise<FoodAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError('GEMINI_API_KEY is not configured.', 500, 'NOT_CONFIGURED');

  // Log key prefix so Vercel logs can confirm the correct key is loaded.
  console.info(`analyzeFood: key=${apiKey.slice(0, 6)}… len=${apiKey.length}`);

  let lastError: GeminiError | null = null;

  for (const model of MODELS) {
    try {
      return await tryModel(apiKey, model, base64Image);
    } catch (err) {
      if (err instanceof GeminiError && err.code === 'NOT_CONFIGURED') {
        // Account-level quota issue — no point trying other models.
        throw err;
      }
      if (err instanceof GeminiError && RETRYABLE_STATUSES.has(err.status)) {
        console.warn(`Model ${model} unavailable (${err.status}), trying next model…`);
        lastError = err;
        continue;
      }
      // Auth errors, config errors, parse failures — fatal.
      throw err;
    }
  }

  throw lastError ?? new GeminiError('All AI models are currently unavailable.', 429);
}

/* Send a text description to a specific model and parse the macro response. */
async function tryModelText(apiKey: string, model: string, userText: string): Promise<FoodAnalysis> {
  const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: TEXT_PROMPT_PREFIX + userText },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw parseGeminiError(response.status, errText, model);
  }

  const result = await response.json();
  const text: string = result.candidates[0].content.parts[0].text;

  const cleanJson = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson) as FoodAnalysis;
}

/*
  Send a natural-language food description to Gemini and parse the macro response.
  Uses the same model fallback chain as analyzeFood.
*/
export async function analyzeFoodText(userText: string): Promise<FoodAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError('GEMINI_API_KEY is not configured.', 500, 'NOT_CONFIGURED');

  console.info(`analyzeFoodText: key=${apiKey.slice(0, 6)}… len=${apiKey.length}`);

  let lastError: GeminiError | null = null;

  for (const model of MODELS) {
    try {
      return await tryModelText(apiKey, model, userText);
    } catch (err) {
      if (err instanceof GeminiError && err.code === 'NOT_CONFIGURED') {
        throw err;
      }
      if (err instanceof GeminiError && RETRYABLE_STATUSES.has(err.status)) {
        console.warn(`Model ${model} unavailable (${err.status}), trying next model…`);
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new GeminiError('All AI models are currently unavailable.', 429);
}
