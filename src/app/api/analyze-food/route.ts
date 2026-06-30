import { analyzeFood, GeminiError } from '@/lib/gemini';
import { getServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// Increase Vercel serverless timeout to handle image processing
export const maxDuration = 30;

/*
  Maximum number of AI analyses allowed per UTC calendar day.
  Keeps the app well within the Gemini free-tier daily quota (1 500 RPD)
  even if the endpoint is called by multiple sessions or automated tools.
*/
const DAILY_LIMIT = 50;

async function getTodayCount(userId: string, date: string): Promise<number> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_date', date)
    .maybeSingle();
  return data?.count ?? 0;
}

async function incrementTodayCount(userId: string, date: string, current: number): Promise<void> {
  const supabase = await getServerClient();
  await supabase
    .from('ai_usage')
    .upsert({ user_id: userId, usage_date: date, count: current + 1 });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    const dailyCount = await getTodayCount(user.id, today);

    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily AI request limit reached. Resets at midnight UTC.', code: 'DAILY_LIMIT' },
        { status: 429 },
      );
    }

    const result = await analyzeFood(image);

    // Increment only after a successful analysis to avoid burning quota on failures.
    await incrementTodayCount(user.id, today, dailyCount);

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof GeminiError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to analyze image';
    console.error('analyze-food error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
