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

/**
 * Pre-auth landing page. Two stacked forms in one card so the user
 * can either sign in or create an account. We don't talk to a backend
 * yet — `useAuth().login`/`register` just stash the typed values in
 * localStorage. The "real" validation/routing lives behind those
 * callbacks so swapping in a server later is a one-file change.
 */
export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  // Shared fields. Kept in component state because the inputs are
  // uncontrolled-ish: we only read them on submit, so we don't need a
  // controlled-input re-render on every keystroke.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Lightweight validation — we're not enforcing password rules yet,
    // but the inputs need *something* typed in. Backend validation
    // will replace this once we wire one up.
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Tiny artificial delay so the spinner is visible — gives the page
    // a bit of life. 300ms is short enough to feel instant.
    setBusy(true);
    window.setTimeout(() => {
      if (mode === 'register') {
        register({ name, email });
      } else {
        // Login uses whatever the user typed, falling back to the
        // email's local-part so the toolbar always has a name to show.
        login({ name, email });
      }
      setBusy(false);
    }, 300);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 font-sans">
      <div className="w-full max-w-md px-4">
        {/* Brand mark — mirrors the top-left of the trading app so the
            handoff feels continuous rather than a totally separate site. */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="size-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
            <TrendingUp className="size-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">Backtest Engine</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Trade smarter, paper first</div>
          </div>
        </div>

        <Card className="shadow-xl border-gray-200/80 dark:border-gray-700/80 rounded-2xl backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              {mode === 'login'
                ? 'Sign in to access your backtest workspace.'
                : 'Set up an account to start running backtests.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Tab switcher. Styled as a modern segmented control. */}
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
              {mode === 'register' && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-gray-600">Full name</span>
                  <div className="relative">
                    <User className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      autoComplete="name"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </label>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600">Email</span>
                <div className="relative">
                  <Mail className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600">Password</span>
                <div className="relative">
                  <Lock className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </label>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2.5 py-1.5">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="h-9 mt-1 font-semibold"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="size-4" />
                    Login
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Create account
                  </>
                )}
              </Button>
            </form>

            <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
              {mode === 'login'
                ? 'No real account needed — anything you type will sign you in.'
                : 'No verification email will be sent. You stay signed in on this device.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
