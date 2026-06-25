'use client';

/*
  LanguageProvider — stores the selected locale in localStorage and
  exposes it via React Context.

  Default locale: 'ru' (matches the existing UI language).
  Falls back to 'ru' if localStorage is unavailable.
*/

import { createContext, useContext, useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { translate, type TranslationKey } from '@/lib/i18n';

const STORAGE_KEY = 'lang';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, ...args: (string | number)[]) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'ru',
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === 'en' || stored === 'ru') {
      setLocaleState(stored);
    }
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function t(key: TranslationKey, ...args: (string | number)[]): string {
    return translate(locale, key, ...args);
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/* Hook for consuming translations in any client component */
export function useT() {
  return useContext(LanguageContext);
}
