/**
 * Thin wrapper around localStorage that handles JSON serialization,
 * parse errors, and SSR environments where `localStorage` is undefined.
 */

const isClient = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function getItem<T>(key: string, fallback: T): T {
  if (!isClient) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (!isClient) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or private browsing in some browsers.
    // Silently ignore — losing session state is non-fatal.
  }
}

export function removeItem(key: string): void {
  if (!isClient) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
