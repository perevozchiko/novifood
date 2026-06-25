import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageProvider, useT, useLang } from '@/providers/LanguageProvider';

function LangDisplay() {
  const { lang, setLang } = useLang();
  const t = useT();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="diary-label">{t('nav_diary')}</span>
      <button onClick={() => setLang('ru')}>Set RU</button>
      <button onClick={() => setLang('en')}>Set EN</button>
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

  it('setLang_ShouldShowEnglish_WhenLangIsEn', () => {
    render(
      <LanguageProvider>
        <LangDisplay />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('diary-label').textContent).toBe('Diary');
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

  it('init_ShouldRestoreStoredLanguage_OnMount', async () => {
    localStorage.setItem('lang', 'ru');
    render(
      <LanguageProvider>
        <LangDisplay />
      </LanguageProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('lang').textContent).toBe('ru');
    });
  });

  it('useT_ShouldThrow_WhenUsedOutsideProvider', () => {
    function BrokenComponent() {
      useT();
      return null;
    }
    expect(() => render(<BrokenComponent />)).toThrow('useT must be used within LanguageProvider');
  });
});
