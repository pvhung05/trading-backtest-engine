import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getItem, setItem, removeItem } from './persistence';

export interface AuthUser {
  // Display name shown in the toolbar (e.g. "Trader", or a name typed
  // in the registration form). We never validate it — there is no real
  // account — but we keep it around so the UI feels less anonymous.
  name: string;
  // Email typed during registration/login. Optional, not validated.
  email?: string;
  // Timestamp of the most recent login. Useful for "Last seen" and to
  // age out the session if we ever need to.
  loggedInAt: number;
}

interface PersistedAuth {
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  // Stand-in for a real backend. We accept whatever the user types and
  // stash it in localStorage so reloads stay logged in.
  login: (input: { name?: string; email?: string }) => void;
  // Same as `login` for now — we don't actually create an account, we
  // just log the user in. Kept as a separate verb so that wiring up a
  // real backend later only requires changing the body of these two
  // functions.
  register: (input: { name: string; email: string }) => void;
  logout: () => void;
}

const AUTH_KEY = 'trading-app-auth';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronous initial read avoids a flash of the login page on reload
  // for users that are already authenticated.
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = getItem<PersistedAuth | null>(AUTH_KEY, null);
    return saved?.user ?? null;
  });

  // Persist the session so a reload (or browser restart) keeps the user
  // logged in. We only write when the value actually changes.
  useEffect(() => {
    if (user) {
      setItem<PersistedAuth>(AUTH_KEY, { user });
    } else {
      removeItem(AUTH_KEY);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: ({ name, email }) => {
        const fallbackName = name?.trim() || email?.split('@')[0] || 'Trader';
        setUser({
          name: fallbackName,
          email: email?.trim() || undefined,
          loggedInAt: Date.now(),
        });
      },
      register: ({ name, email }) => {
        setUser({
          name: name.trim() || 'Trader',
          email: email.trim() || undefined,
          loggedInAt: Date.now(),
        });
      },
      logout: () => setUser(null),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
}
