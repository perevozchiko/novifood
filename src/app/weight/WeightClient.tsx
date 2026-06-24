'use client';

/*
  WeightClient — add entries and view a simple sparkline of weight history.

  Renders a minimal SVG chart so the user can see their trend at a glance.
*/

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addWeight } from '@/lib/weight';
import type { Weight } from '@/types';

interface Props {
  initialHistory: Weight[];
}

function Sparkline({ data }: { data: Weight[] }) {
  if (data.length < 2) return null;

  const values = data.map((w) => w.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 280;
  const H = 80;
  const pad = 8;

  const points = data.map((w, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((w.value - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#16a34a"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((w, i) => {
        const [cx, cy] = points[i].split(',').map(Number);
        return (
          <circle key={w.id} cx={cx} cy={cy} r="3" fill="#16a34a" />
        );
      })}
    </svg>
  );
}

export default function WeightClient({ initialHistory }: Props) {
  const [history, setHistory] = useState<Weight[]>(initialHistory);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(input);
    if (isNaN(value) || value <= 0) {
      setError('Введите корректный вес (кг)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const entry = await addWeight(value);
      setHistory((prev) => [...prev, entry]);
      setInput('');
    } catch {
      setError('Не удалось сохранить. Попробуйте снова.');
    } finally {
      setSaving(false);
    }
  }

  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const delta =
    latest && previous ? +(latest.value - previous.value).toFixed(1) : null;

  return (
    <div className="space-y-4">
      {/* Latest weight card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        {latest ? (
          <div className="flex items-end gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Последнее значение</p>
              <p className="text-4xl font-bold text-gray-900">
                {latest.value} <span className="text-lg font-normal text-gray-400">кг</span>
              </p>
            </div>
            {delta !== null && (
              <p
                className={`text-sm font-medium pb-1 ${
                  delta < 0 ? 'text-green-600' : delta > 0 ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                {delta > 0 ? '+' : ''}
                {delta} кг
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Нет записей. Добавьте первое значение.
          </p>
        )}
      </div>

      {/* Sparkline chart */}
      {history.length >= 2 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-2">Динамика веса</p>
          <Sparkline data={history} />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>
              {new Date(history[0].created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <span>
              {new Date(history[history.length - 1].created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>
      )}

      {/* Add weight form */}
      <form
        onSubmit={handleAdd}
        className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 items-end"
      >
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Вес, кг</label>
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="72.5"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1 bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
        >
          <Plus size={16} />
          {saving ? '…' : 'Добавить'}
        </button>
      </form>

      {/* History list */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          {[...history].reverse().slice(0, 30).map((w) => (
            <div key={w.id} className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-gray-500">
                {new Date(w.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="font-semibold text-gray-900">{w.value} кг</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
