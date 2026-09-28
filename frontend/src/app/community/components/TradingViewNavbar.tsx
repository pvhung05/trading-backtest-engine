import { Search, Plus } from 'lucide-react';
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
  onPublishClick,
  searchQuery = '',
  onSearchChange,
}: TradingViewNavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#131722] border-b border-gray-200/80 dark:border-[#2a2e39] select-none">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Search */}
        <div className="flex items-center gap-6 shrink-0">
          {/* Search Bar (Search Ctrl+K) */}
          <div className="relative w-64 md:w-80 hidden sm:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search (Ctrl+K)"
              className="w-full pl-10 pr-4 py-1.5 bg-gray-100/90 dark:bg-[#1e222d] border border-transparent focus:border-blue-500 rounded-full text-xs font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Center: Navigation Menu (Products, Community) */}
        <nav className="flex items-center gap-3">
          <button
            onClick={() => onNavChange?.('products')}
            className={`h-14 px-3.5 text-xs font-semibold relative flex items-center transition-colors cursor-pointer ${
              activeNav === 'products'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <span>Products</span>
            {activeNav === 'products' && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onNavChange?.('community')}
            className={`h-14 px-3.5 text-xs font-semibold relative flex items-center transition-colors cursor-pointer ${
              activeNav === 'community'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            <span>Community</span>
            {activeNav === 'community' && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Primary CTA: Get started / Publish */}
          <button
            onClick={onPublishClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Get started</span>
          </button>

          {/* User profile dropdown (Vị trí ngoài cùng bên phải đồng nhất) */}
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
