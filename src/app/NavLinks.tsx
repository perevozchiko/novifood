'use client';

/*
  NavLinks — renders navigation items for both the mobile bottom bar
  and the desktop sidebar, adapting layout based on the `variant` prop.
*/

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  Package,
  Scale,
  Settings,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/providers/LanguageProvider';

interface Props {
  variant: 'bottom' | 'sidebar';
}

const NAV_ITEMS: { href: string; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { href: '/', labelKey: 'nav.diary', icon: Utensils },
  { href: '/history', labelKey: 'nav.history', icon: CalendarDays },
  { href: '/weight', labelKey: 'nav.weight', icon: Scale },
  { href: '/products', labelKey: 'nav.products', icon: Package },
  { href: '/stats', labelKey: 'nav.stats', icon: BarChart3 },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export default function NavLinks({ variant }: Props) {
  const { t } = useT();
  const pathname = usePathname();

  if (variant === 'bottom') {
    return (
      <>
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
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
              <Icon size={20} strokeWidth={2} aria-hidden="true" />
              {t(labelKey)}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
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
            <Icon className="shrink-0" size={20} strokeWidth={2} aria-hidden="true" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
