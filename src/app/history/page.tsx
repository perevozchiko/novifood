/*
  History screen — browse and edit meals for past days.

  Server component: reads today's date and passes it to a
  client component that drives the calendar and day fetching.
*/

import HistoryClient from './HistoryClient';

export default function HistoryPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold mb-6">История</h1>
      <HistoryClient today={today} />
    </div>
  );
}
