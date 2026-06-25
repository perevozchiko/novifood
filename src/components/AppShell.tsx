'use client';

/*
  AppShell — responsive application layout.

  Mobile  (< md): bottom navigation bar, full-width single-column content.
  Desktop (md+):  fixed left sidebar with navigation, centred content area.

  Also houses the theme toggle (Sun/Moon) and language toggle (EN/RU).
*/

import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useT } from '@/providers/LanguageProvider';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useT();

  const navItems = [
    { href: '/', icon: '🥗', labelKey: 'nav.diary' as const },
    { href: '/history', icon: '📅', labelKey: 'nav.history' as const },
    { href: '/weight', icon: '⚖️', labelKey: 'nav.weight' as const },
    { href: '/settings', icon: '⚙️', labelKey: 'nav.goals' as const },
  ];

  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const themeAriaLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      {/* ── Desktop sidebar (md+) ── */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:fixed md:inset-y-0 md:left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 px-4 py-6 z-20">
        <span className="text-lg font-bold text-green-700 dark:text-green-400 mb-8 px-2 select-none">
          NoviFood
        </span>

        <nav className="flex-1 space-y-1" aria-label="Main navigation">
          {navItems.map(({ href, icon, labelKey }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-green-700 dark:hover:text-green-400 transition-colors"
            >
              <span className="text-base" aria-hidden="true">
                {icon}
              </span>
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        {/* Theme + Language toggles (bottom of sidebar) */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={toggleTheme}
            aria-label={themeAriaLabel}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ThemeIcon size={16} />
          </button>
          <button
            onClick={() => setLocale(locale === 'en' ? 'ru' : 'en')}
            aria-label={locale === 'en' ? 'Switch to Russian' : 'Switch to English'}
            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {locale === 'en' ? 'RU' : 'EN'}
          </button>
          <span className="ml-auto text-[8px] text-gray-300 dark:text-gray-700 pointer-events-none select-none">
            v{process.env.NEXT_PUBLIC_APP_VERSION}&nbsp;({process.env.NEXT_PUBLIC_GIT_HASH})
          </span>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-56 w-full px-4 pb-24 md:pb-8 max-w-lg mx-auto md:max-w-2xl">
        {children}
      </main>

      {/* ── Mobile bottom navigation (< md) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around py-2 z-10"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, icon, labelKey }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <span className="text-xl" aria-hidden="true">
              {icon}
            </span>
            {t(labelKey)}
          </Link>
        ))}

        {/* Theme + Language controls — top-right corner of the bottom bar */}
        <div className="absolute top-1 right-2 flex items-center gap-0.5">
          <button
            onClick={toggleTheme}
            aria-label={themeAriaLabel}
            className="p-1.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ThemeIcon size={12} />
          </button>
          <button
            onClick={() => setLocale(locale === 'en' ? 'ru' : 'en')}
            aria-label={locale === 'en' ? 'Switch to Russian' : 'Switch to English'}
            className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 hover:text-green-700 dark:hover:text-green-400 px-1 transition-colors"
          >
            {locale === 'en' ? 'RU' : 'EN'}
          </button>
        </div>

        {/* Version badge */}
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-gray-300 dark:text-gray-700 pointer-events-none select-none">
          v{process.env.NEXT_PUBLIC_APP_VERSION}&nbsp;({process.env.NEXT_PUBLIC_GIT_HASH})
        </span>
      </nav>
    </div>
  );
}
