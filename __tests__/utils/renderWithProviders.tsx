/*
  Test utility: render component wrapped in ThemeProvider + LanguageProvider.

  Usage:
    renderWithProviders(<MyComponent />, { lang: 'ru' })   // Russian locale
    renderWithProviders(<MyComponent />)                    // default English locale
*/

import React from 'react';
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { PwaUpdateProvider } from '@/providers/PwaUpdateProvider';
import type { Locale as Lang } from '@/lib/i18n';
import { SPEECH_LANG_STORAGE_KEY } from '@/lib/speech-lang';

interface Options {
  lang?: Lang;
  speechLang?: Lang;
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PwaUpdateProvider>{children}</PwaUpdateProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: Options = {},
): RenderResult {
  const { lang = 'en', speechLang = lang } = options;

  /*
    Pre-seed localStorage so LanguageProvider's useEffect picks up the
    correct language on mount. RTL wraps render in act(), which flushes
    all pending effects before returning, so the component will already
    be in the correct language state after this call returns.
  */
  localStorage.setItem('lang', lang);
  localStorage.setItem(SPEECH_LANG_STORAGE_KEY, speechLang);

  return render(ui, { wrapper: Wrapper });
}
