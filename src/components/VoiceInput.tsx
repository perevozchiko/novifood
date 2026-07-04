'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, StopCircle, RotateCcw } from 'lucide-react';
import PortionSelector from './PortionSelector';
import type { FoodAnalysis, Meal, MealType } from '@/types';
import { useT } from '@/providers/LanguageProvider';
import { speechLocaleToBcp47 } from '@/lib/speech-lang';
import {
  acquireBuiltInMicrophoneStream,
  MicrophoneError,
  releaseMediaStream,
} from '@/lib/microphone';

/*
  VoiceInput component.

  Records via the Mac built-in microphone, transcribes in the browser with the
  Web Speech API (no audio sent to Gemini), then sends text to /api/analyze-voice
  after user confirmation.
*/

const MEAL_TYPE_KEYS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface Props {
  onConfirm: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void>;
}

type Status = 'idle' | 'listening' | 'preview' | 'analysing' | 'review' | 'saving';

interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition;

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function resultsToTranscript(results: SpeechRecognitionResultList): string {
  let text = '';
  for (let i = 0; i < results.length; i++) {
    text += results[i][0].transcript;
  }
  return text;
}

export default function VoiceInput({ onConfirm }: Props) {
  const { t, speechLocale } = useT();
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
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
      if (document.visibilityState !== 'hidden') return;
      releaseRecording();
      setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      releaseRecording();
    };
  }, []);

  function releaseRecording() {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        /* already stopped */
      }
    }
    releaseMediaStream(streamRef.current);
    streamRef.current = null;
    transcriptRef.current = '';
    stoppedByUserRef.current = false;
    hadRecognitionErrorRef.current = false;
  }

  function microphoneErrorMessage(err: MicrophoneError): string {
    if (err.code === 'CONTINUITY_ONLY') {
      return t('voice.errorContinuityMic');
    }
    if (err.code === 'NOT_SUPPORTED') {
      return t('voice.errorNotSupported');
    }
    return t('voice.errorNotSupported');
  }

  function recognitionErrorMessage(code: string): string | null {
    if (code === 'aborted') return null;
    if (code === 'no-speech') return t('voice.errorNoSpeech');
    if (code === 'not-allowed') return t('voice.errorNotSupported');
    return t('voice.errorRecognition');
  }

  function handleReset() {
    releaseRecording();
    setStatus('idle');
    setTranscript('');
    setAnalysis(null);
    setError(null);
    setPortion(1);
    setMealType('');
  }

  function handleRerecord() {
    handleReset();
    void startListening();
  }

  function handleAnalyze() {
    const text = transcript.trim();
    if (!text) return;
    void analyseTranscript(text);
  }

  async function analyseTranscript(text: string) {
    setStatus('analysing');
    setError(null);

    try {
      const res = await fetch('/api/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let msg: string;
        if (data.code === 'NOT_CONFIGURED') {
          msg = t('voice.errorNotConfigured');
        } else if (res.status === 429 && data.code === 'DAILY_LIMIT') {
          msg = t('voice.errorDailyLimit');
        } else if (res.status === 429 || data.code === 'GEMINI_QUOTA') {
          msg = t('voice.errorQuota');
        } else if (res.status === 503 || data.code === 'GEMINI_UNAVAILABLE') {
          msg = t('voice.errorQuota');
        } else if (res.status === 504 || data.code === 'TIMEOUT') {
          msg = t('voice.errorTimeout');
        } else {
          msg = data.error || t('voice.errorAnalysis');
        }
        throw new Error(msg);
      }

      const data: FoodAnalysis = await res.json();
      setAnalysis(data);
      setStatus('review');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('voice.errorAnalysis'));
      setStatus('preview');
    }
  }

  function finishListening() {
    const text = transcriptRef.current.trim();
    if (text) {
      setTranscript(text);
      setStatus('preview');
      return;
    }
    if (stoppedByUserRef.current || hadRecognitionErrorRef.current) {
      setError(t('voice.errorNoSpeech'));
    }
    setStatus('idle');
  }

  async function startListening() {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      setError(t('voice.errorNotSupported'));
      return;
    }

    releaseRecording();
    setError(null);
    setTranscript('');
    setAnalysis(null);
    setPortion(1);
    setMealType('');

    try {
      const stream = await acquireBuiltInMicrophoneStream();
      streamRef.current = stream;

      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLocaleToBcp47(speechLocale);

      recognition.onresult = (event) => {
        const text = resultsToTranscript(event.results);
        transcriptRef.current = text;
        setTranscript(text);
      };

      recognition.onerror = (event) => {
        const msg = recognitionErrorMessage(event.error);
        if (msg) {
          hadRecognitionErrorRef.current = true;
          setError(msg);
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        releaseMediaStream(streamRef.current);
        streamRef.current = null;
        finishListening();
        stoppedByUserRef.current = false;
        hadRecognitionErrorRef.current = false;
      };

      setStatus('listening');
      recognition.start();
    } catch (err: unknown) {
      releaseRecording();
      if (err instanceof MicrophoneError) {
        setError(microphoneErrorMessage(err));
      } else if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError(t('voice.errorNotSupported'));
      } else {
        setError(t('voice.errorRecognition'));
      }
      setStatus('idle');
    }
  }

  function stopListening() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      releaseRecording();
      setStatus('idle');
      return;
    }
    stoppedByUserRef.current = true;
    recognition.stop();
  }

  async function handleConfirm() {
    if (!analysis) return;
    setStatus('saving');
    try {
      await onConfirm({
        name: analysis.name,
        meal_type: mealType || null,
        calories: Math.round(analysis.calories * portion),
        protein: Math.round(analysis.protein * portion),
        fat: Math.round(analysis.fat * portion),
        carbs: Math.round(analysis.carbs * portion),
        eaten_at: new Date().toISOString(),
        notes: null,
      });
      handleReset();
    } catch {
      setError(t('voice.errorSave'));
      setStatus('review');
    }
  }

  return (
    <div>
      {status === 'idle' && (
        <button
          type="button"
          onClick={() => void startListening()}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-2xl py-3 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Mic size={18} />
          {t('voice.button')}
        </button>
      )}

      {status === 'listening' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={stopListening}
            className="w-full flex items-center justify-center gap-2 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-2xl py-3 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <MicOff size={18} className="animate-pulse" />
            <span>{t('voice.listening')}</span>
            <StopCircle size={16} className="ml-1 opacity-70" />
            <span className="text-xs opacity-60">{t('voice.stop')}</span>
          </button>
          <div
            className="min-h-[2.5rem] rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-3 py-2"
            aria-live="polite"
          >
            {transcript ? (
              <p className="text-sm text-gray-800 dark:text-gray-200">{transcript}</p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                {t('voice.speakNow')}
              </p>
            )}
          </div>
        </div>
      )}

      {status === 'preview' && (
        <div className="space-y-3 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-blue-100 dark:border-blue-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t('voice.previewLabel')}
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-gray-100 resize-none"
            aria-label={t('voice.previewLabel')}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRerecord}
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw size={14} />
              {t('voice.rerecord')}
            </button>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!transcript.trim()}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {t('voice.analyze')}
            </button>
          </div>
        </div>
      )}

      {status === 'analysing' && (
        <div className="space-y-2">
          {transcript && (
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
              <span className="font-medium">{t('voice.transcript')}</span> {transcript}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            {t('voice.analysing')}
          </div>
        </div>
      )}

      {error && status !== 'review' && status !== 'saving' && (
        <p className="text-sm text-red-500 mt-2 px-1">{error}</p>
      )}

      {(status === 'review' || status === 'saving') && analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-blue-100 dark:border-blue-900 mt-2">
          {transcript && (
            <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-pre-wrap">
              <span className="font-medium">{t('voice.transcript')}</span> {transcript}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate pr-2">
              {analysis.name}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
            >
              {t('voice.retry')}
            </button>
          </div>

          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {Math.round(analysis.calories * portion)} {t('macro.calories')}
            </span>
            <span>{t('macro.pAbbr')} {Math.round(analysis.protein * portion)}{t('macro.g')}</span>
            <span>{t('macro.fAbbr')} {Math.round(analysis.fat * portion)}{t('macro.g')}</span>
            <span>{t('macro.cAbbr')} {Math.round(analysis.carbs * portion)}{t('macro.g')}</span>
          </div>

          <div className="mb-4">
            <PortionSelector value={portion} onChange={setPortion} />
          </div>

          <select
            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 dark:text-gray-100"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType | '')}
          >
            <option value="">— {t('addMeal.type')} —</option>
            {MEAL_TYPE_KEYS.map((mt) => (
              <option key={mt} value={mt}>
                {t(`addMeal.type.${mt}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>

          <button
            onClick={handleConfirm}
            disabled={status === 'saving'}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {status === 'saving' ? t('voice.confirmAdding') : t('voice.confirm')}
          </button>
        </div>
      )}
    </div>
  );
}
