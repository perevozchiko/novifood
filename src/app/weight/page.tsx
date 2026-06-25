/*
  Weight tracking screen.

  Server component: pre-fetches weight history and passes it to a
  client component for interactive display and entry.
  The page heading is rendered inside WeightClient so it can use useT().
*/

export const dynamic = 'force-dynamic';

import { getWeightHistory } from '@/lib/weight';
import WeightClient from './WeightClient';

export default async function WeightPage() {
  const history = await getWeightHistory();
  return (
    <div className="pt-6">
      <WeightClient initialHistory={history} />
    </div>
  );
}
