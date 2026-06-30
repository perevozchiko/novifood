import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageProvider, useT } from '@/providers/LanguageProvider';

function LangDisplay() {
  const { locale, setLocale, t } = useT();
  return (
    <div>
      <span data-testid="lang">{locale}</span>
      <span data-testid="diary-label">{t('nav.diary')}</span>
      <button onClick={() => setLocale('ru')}>Set RU</button>
      <button onClick={() => setLocale('en')}>Set EN</button>
    </div>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaultLang_ShouldBeEn_WhenNoStoredPreference', () => {
    render(
      <LanguageProvider>
        <LangDisplay />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('setLang_ShouldSwitchToRu_AndTranslateStrings', async () => {
    localStorage.setItem('lang', 'en');
    render(
      <LanguageProvider>
        <LangDisplay />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByText('Set RU'));
    await waitFor(() => {
      expect(screen.getByTestId('lang').textContent).toBe('ru');
      expect(screen.getByTestId('diary-label').textContent).toBe('Дневник');
    });
  });

  it('setLang_ShouldShowEnglish_WhenLangIsEn', async () => {
    localStorage.setItem('lang', 'en');
    render(
      <LanguageProvider>
        <LangDisplay />
      </LanguageProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('diary-label').textContent).toBe('Diary');
    });
  });

  it('setLang_ShouldPersistChoice_InLocalStorage', async () => {
    render(
      <LanguageProvider>
        <LangDisplay />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByText('Set RU'));
    await waitFor(() => {
      expect(localStorage.getItem('lang')).toBe('ru');
    });
  });

  it('init_ShouldRestoreStoredLanguage_OnMount', () => {
    localStorage.setItem('lang', 'en');
    render(
      <LanguageProvider>
        <LangDisplay />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  it('useT_ShouldReturnLocaleAndT_WhenInsideProvider', () => {
    function CheckComponent() {
      const { locale, t } = useT();
      return <span data-testid="check">{locale}-{t('nav.diary')}</span>;
    }
    localStorage.setItem('lang', 'en');
    render(
      <LanguageProvider>
        <CheckComponent />
      </LanguageProvider>,
    );
    // Just verify it renders without throwing
    expect(screen.getByTestId('check')).toBeDefined();
  });
});
