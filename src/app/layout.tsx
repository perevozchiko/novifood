import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { PwaUpdateProvider } from '@/providers/PwaUpdateProvider';
import UpdatePrompt from '@/components/UpdatePrompt';
import ThemeToggle from './ThemeToggle';
import LangToggle from './LangToggle';
import NavLinks from './NavLinks';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NoviFood — Calorie Tracker',
  description: 'Личный трекер питания и веса с ИИ-распознаванием еды',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      {/*
        Inline script prevents flash of wrong theme by applying .dark class
        and setting theme-color meta before the first paint.
        Runs synchronously before any React hydration.
      */}
      <head>
        <meta name="theme-color" content="#ffffff" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var dark=t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#1f2937');}var l=localStorage.getItem('lang');if(l==='en'||l==='ru')document.documentElement.lang=l;})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
            <PwaUpdateProvider>
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
              <div className="flex justify-around py-2 pb-safe">
                <NavLinks variant="bottom" />
              </div>
            </nav>
            <UpdatePrompt />
            </PwaUpdateProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
