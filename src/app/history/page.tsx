/*
  History screen — browse and edit meals for past days.

  Server component: reads today's date and pre-fetches settings so
  the HistoryClient can render a MacroSummary for the selected day.
  The page heading is rendered inside HistoryClient so it can use useT().
*/

export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/settings';
import HistoryClient from './HistoryClient';

export default async function HistoryPage() {
  const today = new Date().toISOString().slice(0, 10);
  const settings = await getSettings();
  return (
    <div className="pt-6">
      <HistoryClient today={today} settings={settings} />
    </div>
  );
}
