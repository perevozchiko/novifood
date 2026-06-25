'use client';

/*
  LangToggle — EN / RU button that updates LanguageProvider locale.
*/

import { useT } from '@/providers/LanguageProvider';

export default function LangToggle() {
  const { locale, setLocale } = useT();

  return (
    <button
      onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
      aria-label="Toggle language"
      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {locale === 'ru' ? 'EN' : 'RU'}
    </button>
  );
}
