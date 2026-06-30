export const REMEMBERED_EMAIL_KEY = 'novifood:remembered-email';

export function loadRememberedEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveRememberedEmail(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
  } catch {
    // localStorage unavailable (private mode, quota, etc.)
  }
}

export function clearRememberedEmail(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // ignore
  }
}
