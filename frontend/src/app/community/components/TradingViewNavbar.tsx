import { useAuth } from '../../context/AuthContext';
import { UserMenu } from '../../components/toolbar/UserMenu';

interface TradingViewNavbarProps {
  activeNav?: 'products' | 'community';
  onNavChange?: (nav: 'products' | 'community') => void;
  onPublishClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function TradingViewNavbar({
  activeNav = 'products',
  onNavChange,
}: TradingViewNavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#131722] border-b border-gray-200/80 dark:border-[#2a2e39] select-none">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-14 flex items-center justify-end">
        {/* Right Action Bar: Navigation (Backtest, Community) & User Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onNavChange?.('products')}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold relative flex items-center transition-all cursor-pointer ${
                activeNav === 'products'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span>Backtest</span>
            </button>

            <button
              onClick={() => onNavChange?.('community')}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold relative flex items-center transition-all cursor-pointer ${
                activeNav === 'community'
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span>Community</span>
            </button>
          </nav>

          {/* Divider */}
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* User profile dropdown (Vị trí ngoài cùng bên phải) */}
          <div className="relative">
            <UserMenu
              userName={user?.name || 'Trader Alex'}
              onLogout={logout}
              onOpenCommunity={() => onNavChange?.('community')}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
