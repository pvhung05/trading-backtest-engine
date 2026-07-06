import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Single source of truth for the dark/light theme. Lives at the top of
// the React tree so every component can read & toggle it.
//
// Persistence strategy:
//   * `localStorage['trading-app-theme']` holds 'dark' or 'light'.
//   * Before React boots, `index.html` runs a tiny inline script that
//     reads localStorage and adds `.dark` to <html>. That guarantees
//     the very first paint matches the user's last choice — no flash
//     of the wrong theme (a.k.a. FOUC/FOWT).
//   * When the provider mounts, it re-reads the same key so its React
//     state stays in sync with what the DOM is already showing. From
//     there on, every state change also writes back to localStorage
//     and updates <html>'s class, so toggling in the menu applies
//     app-wide instantly.
type Theme = 'dark' | 'light';

const STORAGE_KEY = 'trading-app-theme';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage so the React state matches whatever
  // <html> already has at mount time (the inline script in
  // index.html is what set that).
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  // Sync <html> + localStorage whenever the React state changes.
  // We split this from the setter so we never drift: every transition
  // touches both the DOM and storage together.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // If something else (another tab, devtools, a future feature) flips
  // the class on <html>, mirror that change into our React state so
  // the menu's toggle UI stays honest. `storage` events only fire in
  // *other* tabs, so we also observe a MutationObserver on <html> for
  // in-tab changes.
  useEffect(() => {
    const root = document.documentElement;

    const syncFromDom = () => {
      const fromDom = root.classList.contains('dark') ? 'dark' : 'light';
      setThemeState((prev) => (prev === fromDom ? prev : fromDom));
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) syncFromDom();
    };

    window.addEventListener('storage', onStorage);
    const observer = new MutationObserver(syncFromDom);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('storage', onStorage);
      observer.disconnect();
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggle: () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
      setTheme: (next) => setThemeState(next),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // We throw instead of returning a default so a missing provider is
    // caught loudly during development rather than silently rendering
    // an always-light app.
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}