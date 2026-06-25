/*
  Weight tracking screen.

  The heading renders as a static shell immediately on navigation.
  Weight history streams in via a Suspense boundary.
*/

import { Suspense } from 'react';
import { connection } from 'next/server';
import { getWeightHistory } from '@/lib/weight';
import WeightClient from './WeightClient';

function WeightSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="h-3 bg-gray-100 rounded w-24 mb-2" />
        <div className="h-10 bg-gray-100 rounded w-32" />
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="h-3 bg-gray-100 rounded w-28 mb-2" />
        <div className="h-20 bg-gray-100 rounded w-full" />
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
        <div className="flex-1 h-10 bg-gray-100 rounded" />
        <div className="w-24 h-10 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

async function WeightDataLoader() {
  await connection();
  const history = await getWeightHistory();
  return <WeightClient initialHistory={history} />;
}

export default function WeightPage() {
  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold mb-6">Вес</h1>
      <Suspense fallback={<WeightSkeleton />}>
        <WeightDataLoader />
      </Suspense>
    </div>
  );
}
