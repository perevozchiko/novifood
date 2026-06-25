import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';

function ThemeDisplay() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaultTheme_ShouldBeLight_WhenNoStoredPreference', () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('toggle_ShouldSwitchToDark_WhenCurrentlyLight', async () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('toggle_ShouldSwitchToLight_WhenCurrentlyDark', async () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('toggle_ShouldAddDarkClass_ToDocumentElement', () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggle_ShouldRemoveDarkClass_WhenSwitchingBackToLight', () => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggle_ShouldPersistTheme_InLocalStorage', () => {
    render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
