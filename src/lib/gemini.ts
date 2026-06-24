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

/* Send a base64-encoded JPEG to Gemini and parse the macro response. */
export async function analyzeFood(base64Image: string): Promise<FoodAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing in environment variables');

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
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const result = await response.json();
  const text: string = result.candidates[0].content.parts[0].text;

  // Strip accidental markdown fences that some model versions include
  const cleanJson = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanJson) as FoodAnalysis;
}
