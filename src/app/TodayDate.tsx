'use client';

/*
  TodayDate — formats and displays today's date in the user's locale.
*/

import { useMemo } from 'react';
import { useT } from '@/providers/LanguageProvider';
import { formatDate } from '@/lib/i18n';

export default function TodayDate() {
  const { locale } = useT();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const label = formatDate(locale, today, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{label}</p>;
}
