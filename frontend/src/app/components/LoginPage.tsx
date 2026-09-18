import { useState, type FormEvent } from 'react';
import { LogIn, UserPlus, TrendingUp, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../utils/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUser) {
      setError('Please enter your username.');
      return;
    }

    if (mode === 'register' && !trimmedEmail) {
      setError('Please enter your email.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setBusy(true);

    try {
      if (mode === 'register') {
        await register({
          username: trimmedUser,
          email: trimmedEmail,
          password,
        });
      } else {
        await login({
          username: trimmedUser,
          password,
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg =
        err?.message ||
        (err?.errors ? Object.values(err.errors).join(', ') : null) ||
        'Authentication failed. Please check your credentials or backend server.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans">
      <div className="w-full max-w-md px-4">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="size-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
            <TrendingUp className="size-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Backtest Engine</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Trade smarter, paper first</div>
          </div>
        </div>

        <Card className="shadow-xl border-gray-200/80 dark:border-gray-700/80 rounded-2xl backdrop-blur-sm bg-white/90 dark:bg-gray-850/90">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              {mode === 'login'
                ? 'Sign in to access your trading & backtest workspace.'
                : 'Set up an account on the Trading Engine microservices.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Tab switcher */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5 text-sm">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex items-center justify-center gap-1.5 h-8 rounded-lg transition-all duration-150 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium'
                }`}
              >
                <LogIn className="size-3.5" />
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex items-center justify-center gap-1.5 h-8 rounded-lg transition-all duration-150 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-xs font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium'
                }`}
              >
                <UserPlus className="size-3.5" />
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Username</span>
                <div className="relative">
                  <User className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    autoComplete="username"
                    placeholder="trader01"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-8"
                    required
                  />
                </div>
              </label>

              {mode === 'register' && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Email</span>
                  <div className="relative">
                    <Mail className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="trader01@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-8"
                      required
                    />
                  </div>
                </label>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Password</span>
                <div className="relative">
                  <Lock className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-8"
                    required
                  />
                </div>
              </label>

              {error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg p-2.5 break-words">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="h-9 mt-1 font-semibold cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-1.5" />
                    {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="size-4 mr-1.5" />
                    Login
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4 mr-1.5" />
                    Create account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500 text-center">
              Connected to API Gateway at <span className="font-mono text-gray-500 dark:text-gray-400">http://localhost:8080</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
