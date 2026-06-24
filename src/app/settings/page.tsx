/*
  Goals / settings screen.

  Server component: pre-fetches current settings, passes them to a
  client form for editing.
*/

export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/settings';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold mb-2">Цели КБЖУ</h1>
      <p className="text-sm text-gray-500 mb-6">Ваши дневные нормы</p>
      <SettingsClient settings={settings} />
    </div>
  );
}
