/*
  Goals / settings screen.

  Server component: pre-fetches current settings, passes them to a
  client form for editing.
  The page heading and subtitle are rendered inside SettingsClient
  so they can use useT().
*/

export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/settings';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="pt-6">
      <SettingsClient settings={settings} />
    </div>
  );
}
