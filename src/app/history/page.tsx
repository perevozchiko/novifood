/*
  History screen — browse and edit meals for past days.

  Server component: reads today's date and passes it to a
  client component that drives the calendar and day fetching.
  The page heading is rendered inside HistoryClient so it can use useT().
*/

import HistoryClient from './HistoryClient';

export default function HistoryPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="pt-6">
      <HistoryClient today={today} />
    </div>
  );
}
