import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'trading-app-theme';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  setTheme: (next: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

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
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
