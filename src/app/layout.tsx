import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import ThemeToggle from './ThemeToggle';
import LangToggle from './LangToggle';
import NavLinks from './NavLinks';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NoviFood — Calorie Tracker',
  description: 'Личный трекер питания и веса с ИИ-распознаванием еды',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geist.variable} h-full antialiased`}>
      {/*
        Inline script prevents flash of wrong theme by applying .dark class
        before the first paint. Runs synchronously before any React hydration.
      */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <LanguageProvider>
            {/* Desktop layout: sidebar + content; Mobile: content + bottom nav */}
            <div className="flex min-h-screen">

              {/* Desktop sidebar (md+) */}
              <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 md:left-0 md:bg-white md:dark:bg-gray-800 md:border-r md:border-gray-200 md:dark:border-gray-700 md:z-10">
                <div className="flex flex-col flex-1 px-4 py-6">
                  <div className="mb-8">
                    <h1 className="text-xl font-bold text-green-700 dark:text-green-400">NoviFood</h1>
                  </div>
                  <NavLinks variant="sidebar" />
                  <div className="mt-auto flex items-center gap-2">
                    <ThemeToggle />
                    <LangToggle />
                  </div>
                </div>
              </aside>

              {/* Page content */}
              <main className="flex-1 md:ml-56 max-w-lg mx-auto w-full px-4 pb-24 md:pb-8">
                {children}
              </main>
            </div>

            {/* Mobile bottom navigation (< md) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
              <div className="flex justify-around py-2">
                <NavLinks variant="bottom" />
              </div>
              <div className="absolute top-1 right-2 flex gap-1">
                <ThemeToggle />
                <LangToggle />
              </div>
              {/* Version badge */}
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-gray-300 dark:text-gray-600 pointer-events-none select-none">
                v{process.env.NEXT_PUBLIC_APP_VERSION} ({process.env.NEXT_PUBLIC_GIT_HASH})
              </span>
            </nav>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
