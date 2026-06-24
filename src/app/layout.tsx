import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NoviFood — Calorie Tracker',
  description: 'Личный трекер питания и веса с ИИ-распознаванием еды',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24">{children}</main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-10">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">🥗</span>
            Дневник
          </Link>
          <Link
            href="/history"
            className="flex flex-col items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">📅</span>
            История
          </Link>
          <Link
            href="/weight"
            className="flex flex-col items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">⚖️</span>
            Вес
          </Link>
          <Link
            href="/settings"
            className="flex flex-col items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">⚙️</span>
            Цели
          </Link>
        </nav>
      </body>
    </html>
  );
}
