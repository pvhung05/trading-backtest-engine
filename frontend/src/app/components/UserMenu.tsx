import { useEffect, useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface UserMenuProps {
  userName: string;
  onLogout?: () => void;
}

/**
 * Small popover anchored to the user's avatar in the top toolbar.
 * Reads & writes the global theme via `ThemeContext` — toggling here
 * is what flips the entire app to dark/light, since the provider
 * adds `.dark` to <html> and Tailwind's `dark:` variants respond to
 * that class app-wide.
 *
 * Implemented without an external popover library to keep the bundle
 * lean — we just position ourselves under the trigger and close on
 * outside click / Escape.
 */
export function UserMenu({ userName, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  // Ref to the *root* wrapper so we can detect outside clicks anywhere
  // that isn't inside the menu (trigger button + popover panel).
  const rootRef = useRef<HTMLDivElement>(null);

  const { isDark, toggle: toggleTheme } = useTheme();

  // Close on outside click. We listen on `mousedown` rather than
  // `click` so the menu disappears in the same frame the user starts
  // a click elsewhere — feels more responsive.
  useEffect(() => {
    if (!open) return;
    const handleDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [open]);

  // Close on Escape — standard popover a11y behavior.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-blue-700 transition-colors"
        title={userName}
      >
        {userName.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div
          // absolute + mt-1 anchors the panel just under the avatar.
          // min-w-[200px] keeps it from collapsing when the user
          // name is short. shadow-lg + border mimic the rest of the
          // dropdown styling in the app.
          className="absolute left-0 mt-1 min-w-[200px] bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg py-1 z-50"
          role="menu"
        >
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">Signed in as</div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{userName}</div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            role="menuitemcheckbox"
            aria-checked={isDark}
          >
            <span className="flex items-center gap-2">
              {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
              Dark theme
            </span>

            {/* Tiny toggle pill on the right. We use role="switch" so
                screen readers announce it correctly. We swap position
                + colors directly via `isDark` rather than CSS-only
                peer rules — easier to reason about. */}
            <span
              role="switch"
              aria-checked={isDark}
              className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${
                isDark ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 size-3 rounded-full bg-white shadow transition-transform ${
                  isDark ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>

          {onLogout && (
            <>
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}