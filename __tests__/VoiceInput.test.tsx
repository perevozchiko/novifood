import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceInput from '@/components/VoiceInput';
import { renderWithProviders } from './utils/renderWithProviders';
import { SPEECH_LANG_STORAGE_KEY } from '@/lib/speech-lang';
import { MicrophoneError } from '@/lib/microphone';

const mockAcquire = vi.fn();
const mockRelease = vi.fn();

vi.mock('@/lib/microphone', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/microphone')>();
  return {
    ...actual,
    acquireBuiltInMicrophoneStream: (...args: unknown[]) => mockAcquire(...args),
    releaseMediaStream: (...args: unknown[]) => mockRelease(...args),
  };
});

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null =
    null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;

  start = vi.fn(() => {
    this.continuous = true;
    this.interimResults = true;
    MockSpeechRecognition.lastInstance = this;
  });

  stop = vi.fn(() => {
    this.onresult?.({
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'стакан молока 330 грамм' },
          isFinal: true,
          length: 1,
        },
      ] as unknown as SpeechRecognitionResultList,
    });
    this.onend?.();
  });

  abort = vi.fn(() => {
    this.onend?.();
  });

  static lastInstance: MockSpeechRecognition | null = null;
}

const mockAnalysis = {
  name: 'Молоко',
  calories: 130,
  protein: 7,
  fat: 5,
  carbs: 10,
};

function makeMockStream() {
  const track = { stop: vi.fn() };
  return {
    getTracks: () => [track],
  } as unknown as MediaStream;
}

async function submitTranscriptForAnalysis(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('Рассчитать с ИИ'));
}

describe('VoiceInput', () => {
  beforeEach(() => {
    MockSpeechRecognition.lastInstance = null;
    mockAcquire.mockResolvedValue(makeMockStream());
    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
    vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition);
    localStorage.setItem(SPEECH_LANG_STORAGE_KEY, 'ru');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/analyze-voice') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAnalysis),
          });
        }
        return Promise.reject(new Error(`Unexpected fetch: ${url}`));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('render_ShouldShowVoiceButton_WhenIdle', () => {
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });
    expect(screen.getByText('Голосовой ввод')).toBeDefined();
  });

  it('startListening_ShouldUseBuiltInMicrophone', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));

    expect(mockAcquire).toHaveBeenCalledTimes(1);
    expect(MockSpeechRecognition.lastInstance?.lang).toBe('ru-RU');
    expect(MockSpeechRecognition.lastInstance?.continuous).toBe(true);
  });

  it('startListening_ShouldShowSpeakNowPlaceholder_WhenRecording', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));

    expect(screen.getByText('Слушаю…')).toBeDefined();
    expect(screen.getByText('Начните говорить…')).toBeDefined();
  });

  it('stopListening_ShouldShowPreview_WhenStopClicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));
    await user.click(screen.getByText('Стоп'));

    expect(await screen.findByDisplayValue('стакан молока 330 грамм')).toBeDefined();
    expect(fetch).not.toHaveBeenCalledWith('/api/transcribe-voice', expect.anything());
  });

  it('analyze_ShouldCallApi_WhenUserConfirmsPreview', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));
    await user.click(screen.getByText('Стоп'));

    await screen.findByDisplayValue('стакан молока 330 грамм');
    await submitTranscriptForAnalysis(user);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'стакан молока 330 грамм' }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Молоко')).toBeDefined();
    });
  });

  it('analyze_ShouldShowWaitingState_UntilAiResponds', async () => {
    let resolveAnalysis: ((value: typeof mockAnalysis) => void) | undefined;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url === '/api/analyze-voice') {
        return new Promise((resolve) => {
          resolveAnalysis = (value) => resolve({ ok: true, json: () => Promise.resolve(value) });
        });
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    }));
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));
    await user.click(screen.getByText('Стоп'));
    await screen.findByDisplayValue('стакан молока 330 грамм');
    await submitTranscriptForAnalysis(user);

    expect(screen.getByText('Ждём ответ от ИИ…')).toBeDefined();
    expect(screen.getByRole('progressbar', { name: 'Ждём ответ от ИИ…' })).toBeDefined();

    await act(async () => { resolveAnalysis?.(mockAnalysis); });
    expect(await screen.findByText('Молоко')).toBeDefined();
  });

  it('error_ShouldShowContinuityHint_WhenOnlyIphoneMicAvailable', async () => {
    mockAcquire.mockRejectedValue(new MicrophoneError('CONTINUITY_ONLY'));
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));

    expect(
      screen.getByText(/Камеру непрерывности/i),
    ).toBeDefined();
  });

  it('error_ShouldShowNotSupported_WhenSpeechRecognitionMissing', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    act(() => {
      screen.getByText('Голосовой ввод').click();
    });

    expect(
      screen.getByText('Голосовой ввод не поддерживается в этом браузере.'),
    ).toBeDefined();
  });

  it('confirm_ShouldCallOnConfirm_WithScaledMacros', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={onConfirm} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));
    await user.click(screen.getByText('Стоп'));
    await screen.findByDisplayValue('стакан молока 330 грамм');
    await submitTranscriptForAnalysis(user);

    await waitFor(() => {
      expect(screen.getByText('Молоко')).toBeDefined();
    });

    await user.click(screen.getByText('2x'));
    await user.click(screen.getByText('Добавить в дневник'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Молоко',
          calories: 260,
          protein: 14,
          fat: 10,
          carbs: 20,
          weight_grams: 200,
        }),
      );
    });
  });
});
