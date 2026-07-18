'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Product } from '@/types';
import { deletePersonalProduct, getPersonalProducts, savePersonalProduct, searchProducts } from '@/lib/products';
import { useT } from '@/providers/LanguageProvider';

const EMPTY = { name: '', calories: 0, protein: 0, fat: 0, carbs: 0 };
type Editor = typeof EMPTY & { id?: string; baseProductId?: string | null; source?: 'manual' | 'ai' };

export default function ProductsClient() {
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Product[]>([]);
  const [personal, setPersonal] = useState<Product[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void getPersonalProducts().then(setPersonal).catch(() => {}); }, []);
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchProducts(trimmed).then((result) => setMatches(result.products)).catch(() => setMatches([])).finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  function openEditor(product?: Product) {
    setEditor(product ? { id: product.isPersonal ? product.id : undefined, baseProductId: product.isPersonal ? product.baseProductId : product.id, name: product.name, calories: product.calories, protein: product.protein, fat: product.fat, carbs: product.carbs, source: product.source === 'ai' ? 'ai' : 'manual' } : EMPTY);
  }
  function update<K extends keyof Editor>(key: K, value: Editor[K]) { setEditor((current) => current ? { ...current, [key]: value } : current); }
  async function save() {
    if (!editor?.name.trim()) return;
    setSaving(true);
    try {
      const result = await savePersonalProduct(editor);
      setPersonal((current) => [result, ...current.filter((product) => product.id !== result.id && product.baseProductId !== result.baseProductId)]);
      setEditor(null);
    } finally { setSaving(false); }
  }
  async function remove(product: Product) {
    await deletePersonalProduct(product.id);
    setPersonal((current) => current.filter((item) => item.id !== product.id));
  }
  const macros = (product: Product | Editor) => <p className="text-xs text-gray-500 dark:text-gray-400">{product.calories} {t('macro.calories')} · {t('macro.pAbbr')} {product.protein}{t('macro.g')} · {t('macro.fAbbr')} {product.fat}{t('macro.g')} · {t('macro.cAbbr')} {product.carbs}{t('macro.g')} / 100{t('macro.g')}</p>;

  return <section className="py-6 space-y-4">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{t('products.title')}</h1><button type="button" onClick={() => openEditor()} className="inline-flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-2 text-sm"><Plus size={16} />{t('products.new')}</button></div>
    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('products.search')} className="w-full border rounded-xl px-3 py-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100" />
    {query.trim().length >= 2 && <div className="space-y-2">{loading && <p className="text-sm text-gray-500">{t('voice.searching')}</p>}{!loading && matches.length === 0 && <p className="text-sm text-gray-500">{t('products.none')}</p>}{matches.map((product) => <div key={product.id} className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-3 flex gap-2 justify-between"><div><p className="text-sm font-medium">{product.name}</p>{macros(product)}</div><button type="button" onClick={() => openEditor(product)} className="p-2 text-green-700 dark:text-green-400" aria-label={t('products.edit')}><Pencil size={16} /></button></div>)}</div>}
    {query.trim().length === 0 && <p className="text-sm text-gray-500">{t('products.empty')}</p>}
    <div className="pt-4 border-t dark:border-gray-700"><h2 className="font-semibold mb-2">{t('products.personal')}</h2>{personal.map((product) => <div key={product.id} className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-3 flex gap-2 justify-between mb-2"><div><p className="text-sm font-medium">{product.name}</p>{macros(product)}</div><div className="flex"><button type="button" onClick={() => openEditor(product)} className="p-2 text-green-700" aria-label={t('products.edit')}><Pencil size={16} /></button><button type="button" onClick={() => void remove(product)} className="p-2 text-red-600" aria-label={t('products.delete')}><Trash2 size={16} /></button></div></div>)}</div>
    {editor && <div className="rounded-xl border border-green-200 dark:border-green-800 p-3 space-y-3 bg-white dark:bg-gray-800"><input autoFocus value={editor.name} onChange={(event) => update('name', event.target.value)} placeholder={t('addMeal.name')} className="w-full border rounded-lg px-2 py-2 text-sm text-gray-900" /><div className="grid grid-cols-4 gap-2">{([{ key: 'calories', label: t('addMeal.calories') }, { key: 'protein', label: t('macro.protein') }, { key: 'fat', label: t('macro.fat') }, { key: 'carbs', label: t('macro.carbs') }] as const).map(({ key, label }) => <label key={key} className="text-[10px] text-gray-500">{label}<input type="number" min="0" value={editor[key]} onChange={(event) => update(key, Number(event.target.value) || 0)} className="mt-1 w-full border rounded px-1 py-1 text-sm text-gray-900" /></label>)}</div><p className="text-xs text-gray-500">{t('voice.per100g')}</p><div className="flex gap-2"><button type="button" onClick={() => void save()} disabled={saving} className="flex-1 rounded-lg bg-green-600 text-white py-2 text-sm">{t('products.save')}</button><button type="button" onClick={() => setEditor(null)} className="px-3 border rounded-lg text-sm">{t('products.cancel')}</button></div></div>}
    <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">{t('products.attribution')}</p>
  </section>;
}
