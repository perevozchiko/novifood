'use client';

/*
  LanguageProvider — global language context.

  Stores the user's language choice in localStorage under key 'lang'.
  Falls back to 'en' when no stored preference exists.
  Exposes useT() for translation and useLang() for reading/setting the locale.
*/

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Lang, TranslationKey } from '@/lib/i18n';
import { getLocale, getTranslations } from '@/lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'ru') {
      setLangState(stored);
    }
  }, []);

  function setLang(newLang: Lang) {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  }

  const t = useCallback(
    (key: TranslationKey): string => getTranslations(lang)[key],
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, locale: getLocale(lang), setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/*
  Returns the translation function for the current language.
  Must be used inside a component tree wrapped with LanguageProvider.
*/
export function useT(): (key: TranslationKey) => string {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useT must be used within LanguageProvider');
  return ctx.t;
}

/*
  Returns the current language code, locale tag, and a setter function.
*/
export function useLang(): { lang: Lang; locale: string; setLang: (l: Lang) => void } {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return { lang: ctx.lang, locale: ctx.locale, setLang: ctx.setLang };
}
