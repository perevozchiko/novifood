'use client';

/*
  ThemeProvider — global dark / light theme context.

  Applies the 'dark' CSS class to <html> so Tailwind's dark: variant works.
  Choice is persisted to localStorage under key 'theme'.
  The theme-color meta tag is updated dynamically to match the active theme.
*/

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(t: Theme) {
  const html = document.documentElement;
  if (t === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content = t === 'dark' ? '#111827' : '#ffffff';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const initial: Theme = stored === 'dark' ? 'dark' : 'light';
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/*
  Returns the current theme and a toggle function.
  Must be used inside a component tree wrapped with ThemeProvider.
*/
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
