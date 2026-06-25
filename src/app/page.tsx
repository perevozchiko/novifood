/*
  Main diary screen — shows today's meals and macro summary.

  Fetches today's meals and settings server-side, passes them to a
  client-side DiaryClient component that manages optimistic updates.
  The page header (title + date) is rendered inside DiaryClient so it
  can use the i18n hook.
*/

export const dynamic = 'force-dynamic';

import { getMealsByDate } from '@/lib/meals';
import { getSettings } from '@/lib/settings';
import DiaryClient from './DiaryClient';

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function HomePage() {
  const dateStr = todayDateStr();
  const [meals, settings] = await Promise.all([getMealsByDate(dateStr), getSettings()]);

  return (
    <div className="pt-6">
      <DiaryClient initialMeals={meals} settings={settings} dateStr={dateStr} />
    </div>
  );
}
