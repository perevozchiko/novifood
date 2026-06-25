/*
  Goals / settings screen.

  The heading renders as a static shell immediately on navigation.
  Settings data streams in via a Suspense boundary at request time.
*/

import { Suspense } from 'react';
import { connection } from 'next/server';
import { getSettings } from '@/lib/settings';
import SettingsClient from './SettingsClient';

function SettingsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-8" />
          </div>
          <div className="h-9 bg-gray-100 rounded w-full" />
        </div>
      ))}
      <div className="h-12 bg-gray-100 rounded-2xl w-full" />
    </div>
  );
}

async function SettingsDataLoader() {
  await connection();
  const settings = await getSettings();
  return <SettingsClient settings={settings} />;
}

export default function SettingsPage() {
  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold mb-2 dark:text-gray-100">Цели КБЖУ</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ваши дневные нормы</p>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsDataLoader />
      </Suspense>
    </div>
  );
}
