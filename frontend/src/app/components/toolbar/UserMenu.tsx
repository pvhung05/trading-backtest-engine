import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Moon, LogOut, X, Shield, Mail, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface UserMenuProps {
  userName: string;
  onLogout?: () => void;
  onOpenCommunity?: () => void;
}

export function UserMenu({ userName, onLogout }: UserMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { isDark, toggle: toggleTheme } = useTheme();
  const { user } = useAuth();

  const displayName = user?.name || userName || 'Trader Alex';
  const displayEmail = user?.email || `${(user?.name || userName || 'alex.trader').toLowerCase().replace(/\s+/g, '.')}@quant.io`;

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

  useEffect(() => {
    if (!open && !profileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, profileOpen]);

  return (
    <>
      <div ref={rootRef} className="relative">
        {/* Avatar trigger button */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="size-8.5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-blue-400/60 transition-all duration-150 active:scale-95 cursor-pointer select-none"
          title={displayName}
          aria-label="User profile menu"
          aria-expanded={open}
        >
          {displayName.charAt(0).toUpperCase()}
        </button>

        {/* Dropdown Menu Modal */}
        {open && (
          <div
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-2xl p-2 z-50 select-none animate-in fade-in zoom-in-95 duration-150 origin-top-right"
            role="menu"
          >
            {/* Header: User Information */}
            <div className="px-3.5 py-3 border-b border-gray-100 dark:border-gray-700/60">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100 tracking-tight leading-snug truncate">
                  {displayName}
                </div>
                {user?.role && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
                    {user.role}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-400 mt-0.5 truncate font-normal">
                {displayEmail}
              </div>
            </div>

            {/* Menu Items */}
            <div className="pt-1.5 space-y-0.5">
              {/* 1. Profile */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate('/community/profile');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-sm font-medium transition-colors text-left cursor-pointer group"
                role="menuitem"
              >
                <User className="size-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                <span>Profile</span>
              </button>

              {/* 2. Dark mode toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-sm font-medium transition-colors text-left cursor-pointer group"
                role="menuitemcheckbox"
                aria-checked={isDark}
              >
                <div className="flex items-center gap-3">
                  <Moon className="size-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                  <span>Dark Mode</span>
                </div>
                <span
                  className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors ${
                    isDark ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                      isDark ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </button>

              {/* 3. Log out */}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-sm font-medium transition-colors text-left cursor-pointer group"
                  role="menuitem"
                >
                  <LogOut className="size-5 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors shrink-0" />
                  <span>Log out</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Profile */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/80 flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <User className="size-5 text-blue-600 dark:text-blue-400" />
                User Profile
              </h3>
              <button
                onClick={() => setProfileOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white leading-snug">{displayName}</h4>
                  <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50">
                    <Shield className="size-3" />
                    {user?.role || 'Quantitative Trader'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Mail className="size-4 text-gray-400" /> Email
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{displayEmail}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="size-4 text-gray-400" /> Joined
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {user?.loggedInAt ? new Date(user.loggedInAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 2024'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700/80 flex justify-end">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
