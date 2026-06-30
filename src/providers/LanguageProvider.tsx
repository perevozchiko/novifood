'use client';

/*
  LanguageProvider — stores the selected locale in localStorage and
  exposes it via React Context.

  Locale is read synchronously on first client render (and via an inline
  script in layout.tsx before paint) so tab switches never flash Russian
  when English is selected.
*/

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { translate, type TranslationKey } from '@/lib/i18n';

const STORAGE_KEY = 'lang';

function readLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    /* private mode */
  }
  return 'en';
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, ...args: (string | number)[]) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: TranslationKey, ...args: (string | number)[]) => translate(locale, key, ...args),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  return useContext(LanguageContext);
}
