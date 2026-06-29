import { analyzeFoodText, GeminiError } from '@/lib/gemini';
import { getServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

/*
  Shared daily AI usage limit with the image analysis endpoint.
  Both routes read/write the same ai_usage table so the combined
  total stays within the Gemini free-tier daily quota.
*/
const DAILY_LIMIT = 50;

async function getTodayCount(date: string): Promise<number> {
  const supabase = getServerClient();
  const { data } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('usage_date', date)
    .maybeSingle();
  return data?.count ?? 0;
}

async function incrementTodayCount(date: string, current: number): Promise<void> {
  const supabase = getServerClient();
  await supabase
    .from('ai_usage')
    .upsert({ usage_date: date, count: current + 1 });
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const dailyCount = await getTodayCount(today);

    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily AI request limit reached. Resets at midnight UTC.', code: 'DAILY_LIMIT' },
        { status: 429 },
      );
    }

    const result = await analyzeFoodText(text.trim());

    await incrementTodayCount(today, dailyCount);

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof GeminiError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to analyse voice input';
    console.error('analyze-voice error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
