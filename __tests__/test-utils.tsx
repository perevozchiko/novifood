/*
  Shared test utilities — renders components wrapped in providers
  required by the application (LanguageProvider, etc.).
*/

import { render, type RenderOptions } from '@testing-library/react';
import { LanguageProvider } from '@/providers/LanguageProvider';
import type { ReactElement } from 'react';

function AllProviders({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { renderWithProviders as render };
export * from '@testing-library/react';
