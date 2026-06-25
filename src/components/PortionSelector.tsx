'use client';

/*
  PortionSelector component.

  Quick multiplier buttons (0.5x – 2x) for adjusting the AI-analysed
  serving size before saving. Returns a scale factor to the parent.
*/

import { useT } from '@/providers/LanguageProvider';

const PORTIONS = [0.5, 0.75, 1, 1.5, 2] as const;

interface Props {
  value: number;
  onChange: (multiplier: number) => void;
}

export default function PortionSelector({ value, onChange }: Props) {
  const t = useT();
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('portion_label')}</p>
      <div className="flex gap-2 flex-wrap">
        {PORTIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`rounded-lg px-3 py-1 text-sm font-medium border transition-colors ${
              value === p
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-green-400 hover:text-green-700 dark:hover:text-green-400'
            }`}
          >
            {p}x
          </button>
        ))}
      </div>
    </div>
  );
}
