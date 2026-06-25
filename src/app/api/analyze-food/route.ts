import { analyzeFood, GeminiError } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

// Increase Vercel serverless timeout to handle image processing
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const result = await analyzeFood(image);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof GeminiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Failed to analyze image';
    console.error('analyze-food error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
