/*
  Main diary screen — shows today's meals and macro summary.

  Fetches today's meals and settings server-side, passes them to a
  client-side DiaryClient component that manages optimistic updates.
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

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-green-700">NoviFood</h1>
        <p className="text-sm text-gray-500 capitalize">{today}</p>
      </header>

      <DiaryClient initialMeals={meals} settings={settings} />
    </div>
  );
}
