import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, type UserResponse, type LoginPayload, type RegisterPayload } from '../services/authApi';
import { getAuthToken, setAuthToken } from '../services/apiClient';

export interface AuthUser {
  id?: number;
  name: string;
  email?: string;
  role?: string;
  loggedInAt: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginPayload) => Promise<void>;
  register: (input: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AUTH_USER_KEY = 'trading-app-user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Validate token on mount with safety timeout
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      localStorage.removeItem(AUTH_USER_KEY);
      setLoading(false);
      return;
    }

    let isDone = false;
    const safetyTimeout = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        setLoading(false);
      }
    }, 2500);

    authApi
      .getMe()
      .then((me: UserResponse) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(safetyTimeout);
        const authUser: AuthUser = {
          id: me.id,
          name: me.username,
          email: me.email,
          role: me.role,
          loggedInAt: Date.now(),
        };
        setUser(authUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
      })
      .catch((err) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(safetyTimeout);
        console.warn('Session verification failed, logging out:', err);
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem(AUTH_USER_KEY);
      })
      .finally(() => {
        clearTimeout(safetyTimeout);
        setLoading(false);
      });

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);

  const login = async (input: LoginPayload) => {
    const res = await authApi.login(input);
    const authUser: AuthUser = {
      id: res.user?.id,
      name: res.user?.username || input.username,
      email: res.user?.email,
      role: res.user?.role,
      loggedInAt: Date.now(),
    };
    setUser(authUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
  };

  const register = async (input: RegisterPayload) => {
    const res = await authApi.register(input);
    const authUser: AuthUser = {
      id: res.user?.id,
      name: res.user?.username || input.username,
      email: res.user?.email || input.email,
      role: res.user?.role,
      loggedInAt: Date.now(),
    };
    setUser(authUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading]
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
