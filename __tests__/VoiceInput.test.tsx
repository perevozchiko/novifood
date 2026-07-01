import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceInput from '@/components/VoiceInput';
import { renderWithProviders } from './utils/renderWithProviders';
import { SPEECH_LANG_STORAGE_KEY } from '@/lib/speech-lang';

type ResultChunk = { transcript: string; isFinal: boolean };

class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onend: (() => void) | null = null;

  start = vi.fn(() => {
    MockSpeechRecognition.lastInstance = this;
  });

  stop = vi.fn(() => {
    this.onend?.();
  });

  abort = vi.fn(() => {
    this.onend?.();
  });

  static lastInstance: MockSpeechRecognition | null = null;

  emitResult(chunks: ResultChunk[], resultIndex = 0) {
    const results = chunks.map(({ transcript, isFinal }) => {
      const alt = { transcript, confidence: 0.9 };
      return {
        isFinal,
        length: 1,
        item: () => alt,
        0: alt,
      };
    });

    this.onresult?.({
      resultIndex,
      results: Object.assign(results, { length: results.length }),
    } as Event);
  }

  emitError(error: string) {
    this.onerror?.({ error } as Event);
  }

  emitEnd() {
    this.onend?.();
  }
}

function installSpeechRecognition() {
  const SR = MockSpeechRecognition as unknown as typeof window.SpeechRecognition;
  window.SpeechRecognition = SR;
  window.webkitSpeechRecognition = SR;
}

function removeSpeechRecognition() {
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
  MockSpeechRecognition.lastInstance = null;
}

const mockAnalysis = {
  name: 'Молоко',
  calories: 130,
  protein: 7,
  fat: 5,
  carbs: 10,
};

async function submitTranscriptForAnalysis(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('Отправить на анализ'));
}

describe('VoiceInput', () => {
  beforeEach(() => {
    installSpeechRecognition();
    localStorage.setItem(SPEECH_LANG_STORAGE_KEY, 'ru');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalysis),
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    removeSpeechRecognition();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('render_ShouldShowVoiceButton_WhenIdle', () => {
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });
    expect(screen.getByText('Голосовой ввод')).toBeDefined();
  });

  it('startListening_ShouldUseSpeechLocaleFromSettings', async () => {
    localStorage.setItem(SPEECH_LANG_STORAGE_KEY, 'ru');
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'en', speechLang: 'ru' });

    await user.click(screen.getByText('Voice input'));

    expect(MockSpeechRecognition.lastInstance?.lang).toBe('ru-RU');
  });

  it('startListening_ShouldShowSpeakNowPlaceholder_WhenNoSpeechYet', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));

    expect(screen.getByText('Слушаю…')).toBeDefined();
    expect(screen.getByText('Начните говорить…')).toBeDefined();
    expect(MockSpeechRecognition.lastInstance?.interimResults).toBe(true);
  });

  it('onresult_ShouldShowInterimTranscript_WhileSpeaking', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));
    act(() => {
      MockSpeechRecognition.lastInstance!.emitResult([
        { transcript: 'стакан молока', isFinal: false },
      ]);
    });

    const liveText = await screen.findByText('стакан молока');
    expect(liveText.className).toContain('italic');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('onresult_ShouldShowPreview_WhenSpeechEnds', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));
    act(() => {
      MockSpeechRecognition.lastInstance!.emitResult([
        { transcript: 'стакан молока 330 грамм', isFinal: true },
      ]);
      MockSpeechRecognition.lastInstance!.emitEnd();
    });

    expect(await screen.findByDisplayValue('стакан молока 330 грамм')).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('analyze_ShouldCallApi_WhenUserConfirmsPreview', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));
    act(() => {
      MockSpeechRecognition.lastInstance!.emitResult([
        { transcript: 'стакан молока 330 грамм', isFinal: true },
      ]);
      MockSpeechRecognition.lastInstance!.emitEnd();
    });

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

  it('onresult_ShouldNotAutoAnalyze_WhenOnlyInterimResults', async () => {
    vi.useFakeTimers();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    fireEvent.click(screen.getByText('Голосовой ввод'));
    act(() => {
      MockSpeechRecognition.lastInstance!.emitResult([
        { transcript: 'яблоко 150 грамм', isFinal: false },
      ]);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fetch).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('stopListening_ShouldShowPreview_WhenStopClicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));
    act(() => {
      MockSpeechRecognition.lastInstance!.emitResult([
        { transcript: 'яблоко', isFinal: false },
      ]);
    });

    await user.click(screen.getByText('Стоп'));

    expect(await screen.findByDisplayValue('яблоко')).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('error_ShouldShowNotSupported_WhenSpeechRecognitionMissing', () => {
    removeSpeechRecognition();
    renderWithProviders(<VoiceInput onConfirm={vi.fn()} />, { lang: 'ru' });

    fireEvent.click(screen.getByText('Голосовой ввод'));

    expect(
      screen.getByText('Голосовой ввод не поддерживается в этом браузере.'),
    ).toBeDefined();
  });

  it('confirm_ShouldCallOnConfirm_WithScaledMacros', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithProviders(<VoiceInput onConfirm={onConfirm} />, { lang: 'ru' });

    await user.click(screen.getByText('Голосовой ввод'));
    act(() => {
      MockSpeechRecognition.lastInstance!.emitResult([
        { transcript: 'молоко', isFinal: true },
      ]);
      MockSpeechRecognition.lastInstance!.emitEnd();
    });

    await submitTranscriptForAnalysis(user);

    await waitFor(() => {
      expect(screen.getByText('Молоко')).toBeDefined();
    });

    fireEvent.click(screen.getByText('2x'));
    await user.click(screen.getByText('Добавить в дневник'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Молоко',
          calories: 260,
          protein: 14,
          fat: 10,
          carbs: 20,
        }),
      );
    });
  });
});
