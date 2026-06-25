'use client';

/*
  NavLinks — renders navigation items for both the mobile bottom bar
  and the desktop sidebar, adapting layout based on the `variant` prop.
*/

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/providers/LanguageProvider';

interface Props {
  variant: 'bottom' | 'sidebar';
}

const NAV_ITEMS = [
  { href: '/', labelKey: 'nav.diary' as const, icon: '🥗' },
  { href: '/history', labelKey: 'nav.history' as const, icon: '📅' },
  { href: '/weight', labelKey: 'nav.weight' as const, icon: '⚖️' },
  { href: '/settings', labelKey: 'nav.goals' as const, icon: '⚙️' },
];

export default function NavLinks({ variant }: Props) {
  const { t } = useT();
  const pathname = usePathname();

  if (variant === 'bottom') {
    return (
      <>
        {NAV_ITEMS.map(({ href, labelKey, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                active
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              <span className="text-xl">{icon}</span>
              {t(labelKey)}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, labelKey, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg">{icon}</span>
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
