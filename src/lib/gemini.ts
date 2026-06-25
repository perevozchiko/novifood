import type { FoodAnalysis } from '@/types';

/*
  Server-only Gemini integration.

  Called exclusively from the /api/analyze-food route so that
  GEMINI_API_KEY never reaches the browser bundle.
*/

const MODEL = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = `Analyse the food in this photo.
Respond ONLY with a valid JSON object. Do not include markdown codeblocks, wrapping, or explanations.
Structure:
{"name":"Dish Name in Russian","calories":0,"protein":0,"fat":0,"carbs":0}
All macro values must be integers representing the full portion visible in the photo.
Calories in kcal, protein/fat/carbs in grams.`;

/*
  Structured error that carries an HTTP status so the API route can forward
  the right status code to the client without exposing Gemini internals.
*/
export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/* Extract a short human-readable message from a Gemini error response body. */
function parseGeminiError(status: number, body: string): GeminiError {
  // Log the full body on the server so developers can inspect it.
  console.error(`Gemini API error ${status}:`, body);

  try {
    const json = JSON.parse(body) as { error?: { message?: string; status?: string } };
    const raw = json.error?.message ?? '';

    if (status === 429) {
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

/* Send a base64-encoded JPEG to Gemini and parse the macro response. */
export async function analyzeFood(base64Image: string): Promise<FoodAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError('GEMINI_API_KEY is not configured.', 500);

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
            { text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw parseGeminiError(response.status, errText);
  }

  const result = await response.json();
  const text: string = result.candidates[0].content.parts[0].text;

  // Strip accidental markdown fences that some model versions include.
  const cleanJson = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson) as FoodAnalysis;
}
