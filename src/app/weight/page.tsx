/*
  Weight tracking screen.

  Server component: pre-fetches weight history and passes it to a
  client component for interactive display and entry.
*/

export const dynamic = 'force-dynamic';

import { getWeightHistory } from '@/lib/weight';
import WeightClient from './WeightClient';

export default async function WeightPage() {
  const history = await getWeightHistory();
  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold mb-6">Вес</h1>
      <WeightClient initialHistory={history} />
    </div>
  );
}
