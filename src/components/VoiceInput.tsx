'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, RotateCcw, StopCircle } from 'lucide-react';
import PortionSelector from './PortionSelector';
import type { Meal, MealType, Product, VoiceFoodAnalysis } from '@/types';
import { useT } from '@/providers/LanguageProvider';
import { speechLocaleToBcp47 } from '@/lib/speech-lang';
import { nutritionForWeight, normalizeWeightInput } from '@/lib/product-nutrition';
import { savePersonalProduct, searchProducts } from '@/lib/products';
import { acquireBuiltInMicrophoneStream, MicrophoneError, releaseMediaStream } from '@/lib/microphone';

const MEAL_TYPE_KEYS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface Props {
  onConfirm: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void>;
}

type Status = 'idle' | 'listening' | 'preview' | 'analysing' | 'review' | 'saving';

interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event { error: string; message?: string }
interface ISpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => ISpeechRecognition;

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function resultsToTranscript(results: SpeechRecognitionResultList): string {
  let text = '';
  for (let i = 0; i < results.length; i++) text += results[i][0].transcript;
  return text;
}

function productToAnalysis(product: Product): VoiceFoodAnalysis {
  return { name: product.name, portionGrams: 100, calories: product.calories, protein: product.protein, fat: product.fat, carbs: product.carbs };
}

export default function VoiceInput({ onConfirm }: Props) {
  const { t, speechLocale } = useT();
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [analysis, setAnalysis] = useState<VoiceFoodAnalysis | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [weight, setWeight] = useState('100');
  const [portion, setPortion] = useState(1);
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const stoppedByUserRef = useRef(false);
  const hadRecognitionErrorRef = useRef(false);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        releaseRecording();
        setStatus((previous) => previous === 'listening' ? 'idle' : previous);
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', onVisibilityChange); releaseRecording(); };
  }, []);

  function releaseRecording() {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) { try { recognition.abort(); } catch { /* already stopped */ } }
    releaseMediaStream(streamRef.current);
    streamRef.current = null;
    transcriptRef.current = '';
    stoppedByUserRef.current = false;
    hadRecognitionErrorRef.current = false;
  }

  function reset() {
    releaseRecording();
    setStatus('idle'); setTranscript(''); setResults([]); setAnalysis(null); setSelectedProduct(null); setWeight('100'); setPortion(1); setMealType(''); setError(null); setSearching(false);
  }

  async function findProducts(text: string) {
    setSearching(true); setResults([]); setError(null);
    try {
      const response = await searchProducts(text);
      setResults(response.products);
    } catch {
      // The card remains useful when the catalogue is offline: AI is offered below.
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function finishListening() {
    const text = transcriptRef.current.trim();
    if (text) {
      setTranscript(text);
      setStatus('preview');
      void findProducts(text);
      return;
    }
    if (stoppedByUserRef.current || hadRecognitionErrorRef.current) setError(t('voice.errorNoSpeech'));
    setStatus('idle');
  }

  async function startListening() {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) { setError(t('voice.errorNotSupported')); return; }
    reset();
    try {
      const stream = await acquireBuiltInMicrophoneStream();
      streamRef.current = stream;
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.continuous = true; recognition.interimResults = true; recognition.lang = speechLocaleToBcp47(speechLocale);
      recognition.onresult = (event) => { const text = resultsToTranscript(event.results); transcriptRef.current = text; setTranscript(text); };
      recognition.onerror = (event) => {
        if (event.error === 'aborted') return;
        hadRecognitionErrorRef.current = true;
        setError(event.error === 'no-speech' ? t('voice.errorNoSpeech') : event.error === 'not-allowed' ? t('voice.errorNotSupported') : t('voice.errorRecognition'));
      };
      recognition.onend = () => { recognitionRef.current = null; releaseMediaStream(streamRef.current); streamRef.current = null; finishListening(); stoppedByUserRef.current = false; hadRecognitionErrorRef.current = false; };
      setStatus('listening'); recognition.start();
    } catch (err: unknown) {
      releaseRecording();
      setError(err instanceof MicrophoneError && err.code === 'CONTINUITY_ONLY' ? t('voice.errorContinuityMic') : err instanceof DOMException && err.name === 'NotAllowedError' ? t('voice.errorNotSupported') : t('voice.errorRecognition'));
      setStatus('idle');
    }
  }

  function stopListening() {
    if (!recognitionRef.current) { releaseRecording(); setStatus('idle'); return; }
    stoppedByUserRef.current = true;
    recognitionRef.current.stop();
  }

  async function analyseTranscript() {
    const text = transcript.trim();
    if (!text) return;
    setStatus('analysing'); setError(null);
    try {
      const response = await fetch('/api/analyze-voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.code === 'NOT_CONFIGURED' ? t('voice.errorNotConfigured') : data.code === 'DAILY_LIMIT' ? t('voice.errorDailyLimit') : response.status === 429 || data.code === 'GEMINI_QUOTA' || response.status === 503 ? t('voice.errorQuota') : response.status === 504 ? t('voice.errorTimeout') : data.error || t('voice.errorAnalysis');
        throw new Error(message);
      }
      const data = await response.json() as VoiceFoodAnalysis;
      setAnalysis({ ...data, portionGrams: data.portionGrams > 0 ? data.portionGrams : 100 });
      setSelectedProduct(null);
      setWeight(String(data.portionGrams > 0 ? data.portionGrams : 100));
      setPortion(1); setStatus('review');
    } catch (err) { setError(err instanceof Error ? err.message : t('voice.errorAnalysis')); setStatus('preview'); }
  }

  function chooseProduct(product: Product) {
    setAnalysis(productToAnalysis(product)); setSelectedProduct(product); setWeight('100'); setPortion(1); setStatus('review');
  }

  const parsedWeight = normalizeWeightInput(weight);
  const effectiveWeight = parsedWeight ? parsedWeight * portion : null;
  const totals = analysis && effectiveWeight ? nutritionForWeight(analysis, effectiveWeight) : null;

  async function confirm() {
    if (!analysis || !totals || !effectiveWeight) return;
    setStatus('saving');
    try {
      await onConfirm({ name: analysis.name.trim(), meal_type: mealType || null, calories: totals.calories, protein: totals.protein, fat: totals.fat, carbs: totals.carbs, eaten_at: new Date().toISOString(), notes: null });
      void savePersonalProduct({ name: analysis.name.trim(), baseProductId: selectedProduct?.isPersonal ? selectedProduct.baseProductId : selectedProduct?.id, calories: analysis.calories, protein: analysis.protein, fat: analysis.fat, carbs: analysis.carbs, source: selectedProduct ? 'manual' : 'ai' }).catch(() => {});
      reset();
    } catch { setError(t('voice.errorSave')); setStatus('review'); }
  }

  function updateAnalysis(key: keyof Pick<VoiceFoodAnalysis, 'name' | 'calories' | 'protein' | 'fat' | 'carbs'>, value: string) {
    if (!analysis) return;
    setAnalysis({ ...analysis, [key]: key === 'name' ? value : Math.max(0, Number(value) || 0) });
  }

  return <div>
    {status === 'idle' && <button type="button" onClick={() => void startListening()} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-2xl py-3 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Mic size={18} />{t('voice.button')}</button>}
    {status === 'listening' && <div className="space-y-2"><button type="button" onClick={stopListening} className="w-full flex items-center justify-center gap-2 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-2xl py-3 text-sm font-medium"><MicOff size={18} className="animate-pulse" /><span>{t('voice.listening')}</span><StopCircle size={16} /><span className="text-xs opacity-60">{t('voice.stop')}</span></button><div className="min-h-[2.5rem] rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-3 py-2" aria-live="polite"><p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{transcript || t('voice.speakNow')}</p></div></div>}
    {(status === 'preview' || status === 'analysing') && <div className="space-y-3 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-blue-100 dark:border-blue-900 mt-2"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('voice.previewLabel')}</p><textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={3} className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap" aria-label={t('voice.previewLabel')} />{status === 'preview' && <><div className="text-xs text-gray-500 dark:text-gray-400">{searching ? <span className="inline-flex gap-1 items-center"><Loader2 size={14} className="animate-spin" />{t('voice.searching')}</span> : results.length ? t('voice.matches') : t('voice.noMatches')}</div>{results.length > 0 && <div className="space-y-2">{results.map((product) => <button key={product.id} type="button" onClick={() => chooseProduct(product)} className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-600 p-2 hover:border-blue-400"><span className="block text-sm font-medium">{product.name}</span><span className="text-xs text-gray-500">{product.calories} {t('macro.calories')} · {t('macro.pAbbr')} {product.protein}{t('macro.g')} · {t('macro.fAbbr')} {product.fat}{t('macro.g')} · {t('macro.cAbbr')} {product.carbs}{t('macro.g')} / 100{t('macro.g')}</span></button>)}</div>}<div className="flex gap-2"><button type="button" onClick={() => { reset(); void startListening(); }} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm"><RotateCcw size={14} />{t('voice.rerecord')}</button>{!searching && results.length === 0 && <button type="button" onClick={() => void analyseTranscript()} disabled={!transcript.trim()} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">{t('voice.analyze')}</button>}</div></>}</div>}
    {error && status !== 'review' && status !== 'saving' && <p className="text-sm text-red-500 mt-2 px-1">{error}</p>}
    {(status === 'review' || status === 'saving') && analysis && <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-blue-100 dark:border-blue-900 mt-2 space-y-3"><div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{analysis.name}</h3><button onClick={reset} className="text-xs text-gray-400">{t('voice.retry')}</button></div>{transcript && <p className="text-xs text-gray-400 whitespace-pre-wrap"><span className="font-medium">{t('voice.transcript')}</span> {transcript}</p>}<label className="block text-xs text-gray-500">{t('voice.productName')}<input value={analysis.name} onChange={(event) => updateAnalysis('name', event.target.value)} className="mt-1 w-full border rounded-lg px-2 py-1 text-sm text-gray-900" /></label><div className="grid grid-cols-4 gap-2">{([{ key: 'calories', label: t('addMeal.calories') }, { key: 'protein', label: t('macro.protein') }, { key: 'fat', label: t('macro.fat') }, { key: 'carbs', label: t('macro.carbs') }] as const).map(({ key, label }) => <label key={key} className="text-[10px] text-gray-500">{label}<input type="number" min="0" value={analysis[key]} onChange={(event) => updateAnalysis(key, event.target.value)} className="mt-1 w-full border rounded-lg px-1 py-1 text-sm text-gray-900" /></label>)}</div><p className="text-xs text-gray-500">{t('voice.per100g')}</p><label className="block text-xs text-gray-500">{t('voice.weight')}<input inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} className="mt-1 w-full border rounded-lg px-2 py-1 text-sm text-gray-900" aria-invalid={!parsedWeight} /></label><PortionSelector value={portion} onChange={setPortion} /><div className="flex gap-3 text-xs text-gray-500"><span className="font-semibold text-gray-900">{totals?.calories ?? 0} {t('macro.calories')}</span><span>{t('macro.pAbbr')} {totals?.protein ?? 0}{t('macro.g')}</span><span>{t('macro.fAbbr')} {totals?.fat ?? 0}{t('macro.g')}</span><span>{t('macro.cAbbr')} {totals?.carbs ?? 0}{t('macro.g')}</span></div><select className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900" value={mealType} onChange={(event) => setMealType(event.target.value as MealType | '')}><option value="">— {t('addMeal.type')} —</option>{MEAL_TYPE_KEYS.map((meal) => <option key={meal} value={meal}>{t(`addMeal.type.${meal}` as Parameters<typeof t>[0])}</option>)}</select><button onClick={() => void confirm()} disabled={status === 'saving' || !totals || !analysis.name.trim()} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">{status === 'saving' ? t('voice.confirmAdding') : t('voice.confirm')}</button></div>}
  </div>;
}
