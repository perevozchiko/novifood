import { transcribeSpeechAudio, GeminiError } from '@/lib/gemini';
import { getServerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const DAILY_LIMIT = 50;
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

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

    const { audio, mimeType, locale } = await req.json();

    if (!audio || typeof audio !== 'string') {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json({ error: 'No mimeType provided' }, { status: 400 });
    }
    if (locale !== 'en' && locale !== 'ru') {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    const byteLength = Buffer.byteLength(audio, 'base64');
    if (byteLength > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio too large' }, { status: 413 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const dailyCount = await getTodayCount(user.id, today);

    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily AI request limit reached. Resets at midnight UTC.', code: 'DAILY_LIMIT' },
        { status: 429 },
      );
    }

    const transcript = await transcribeSpeechAudio(audio, mimeType, locale);

    await incrementTodayCount(user.id, today, dailyCount);

    return NextResponse.json({ transcript });
  } catch (error: unknown) {
    if (error instanceof GeminiError) {
      return NextResponse.json(
        { error: error.message, ...(error.code ? { code: error.code } : {}) },
        { status: error.status },
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to transcribe voice input';
    console.error('transcribe-voice error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
