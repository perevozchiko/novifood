/*
  History screen — browse and edit meals for past days.

  Static heading renders instantly; HistoryContent is wrapped in Suspense
  so its Supabase fetch is deferred to request time (PPR-compatible).
*/

import { Suspense } from 'react';
import { connection } from 'next/server';
import { getSettings } from '@/lib/settings';
import HistoryClient from './HistoryClient';

function HistorySkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
        <div className="w-9 h-9 bg-gray-100 rounded-lg" />
        <div className="h-4 bg-gray-100 rounded w-28" />
        <div className="w-9 h-9 bg-gray-100 rounded-lg" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

async function HistoryContent() {
  await connection();
  const settings = await getSettings();
  return <HistoryClient settings={settings} />;
}

export default function HistoryPage() {
  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-gray-100">История</h1>
      <Suspense fallback={<HistorySkeleton />}>
        <HistoryContent />
      </Suspense>
    </div>
  );
}
