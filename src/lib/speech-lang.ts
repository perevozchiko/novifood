/*
  Speech recognition language helpers.

  Stored separately from UI locale so voice input can use Russian
  even when the app interface is in English (or vice versa).
*/

import type { Locale } from '@/lib/i18n';

export const SPEECH_LANG_STORAGE_KEY = 'speech-lang';

export function speechLocaleToBcp47(locale: Locale): string {
  return locale === 'en' ? 'en-US' : 'ru-RU';
}

export function readSpeechLocale(fallback: Locale = 'en'): Locale {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(SPEECH_LANG_STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    /* private mode */
  }
  return fallback;
}

export function writeSpeechLocale(locale: Locale): void {
  try {
    localStorage.setItem(SPEECH_LANG_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
