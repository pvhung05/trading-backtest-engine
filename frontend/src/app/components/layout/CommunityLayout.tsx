import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lightbulb, MessageSquare, Users, UserCheck } from 'lucide-react';

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matcher: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'ideas',
    path: '/community',
    label: 'Trading Ideas',
    icon: Lightbulb,
    matcher: (p) => p === '/community' || p.startsWith('/community/ideas') || (!p.includes('/feed') && !p.includes('/groups') && !p.includes('/friends') && !p.includes('/profile')),
  },
  {
    id: 'feed',
    path: '/community/feed',
    label: 'Social Feed',
    icon: MessageSquare,
    matcher: (p) => p.startsWith('/community/feed'),
  },
  {
    id: 'groups',
    path: '/community/groups',
    label: 'Trading Groups',
    icon: Users,
    matcher: (p) => p.startsWith('/community/groups'),
  },
  {
    id: 'friends',
    path: '/community/friends',
    label: 'Friends & Network',
    icon: UserCheck,
    matcher: (p) => p.startsWith('/community/friends'),
  },
];

export function CommunityLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const pathname = location.pathname;

  const isProfileActive = pathname.startsWith('/community/profile');

  return (
    <div className="flex-1 flex min-h-0 relative bg-white dark:bg-[#131722] text-gray-900 dark:text-gray-100 font-sans">
      {/* =========================================================================
          PERSISTENT VERTICAL CIRCULAR NAVIGATION DOCK ON THE LEFT EDGE
         ========================================================================= */}
      <aside
        className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3 p-2 bg-white/90 dark:bg-[#1e222d]/90 backdrop-blur-xl border border-gray-200/80 dark:border-[#2a2e39] rounded-full shadow-2xl transition-all"
        aria-label="Community persistent navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.matcher(pathname);
          return (
            <div key={item.id} className="relative group flex items-center">
              <button
                onClick={() => navigate(item.path)}
                className={`size-11 sm:size-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:scale-105'
                }`}
                aria-label={item.label}
              >
                <Icon className="size-5" />
              </button>

              {/* Hover Name in English (Tooltip badge to the right) */}
              <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gray-900/95 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold whitespace-nowrap shadow-xl opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 flex items-center">
                <span>{item.label}</span>
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95 dark:border-r-gray-100" />
              </div>
            </div>
          );
        })}

        {/* Divider */}
        <div className="w-6 h-px bg-gray-200 dark:bg-gray-700/80 mx-auto my-0.5" />

        {/* Action: Profile Button */}
        <div className="relative group flex items-center">
          <button
            onClick={() => navigate('/community/profile')}
            className={`size-11 sm:size-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden p-0.5 border-2 ${
              isProfileActive
                ? 'border-blue-600 shadow-lg shadow-blue-500/40 scale-105 ring-2 ring-blue-400/40'
                : 'border-transparent hover:border-blue-500 hover:scale-105'
            }`}
            aria-label="Community Profile"
          >
            <img
              src={
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
              }
              alt="Profile"
              className="size-full rounded-full object-cover"
            />
          </button>
          <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gray-900/95 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold whitespace-nowrap shadow-xl opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 flex items-center">
            <span>Community Profile</span>
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95 dark:border-r-gray-100" />
          </div>
        </div>
      </aside>

      {/* =========================================================================
          ROUTED SUB-PAGE CONTENT (WITH LEFT PADDING FOR THE DOCK)
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-scroll [scrollbar-gutter:stable] pl-16 sm:pl-20">
        <Outlet />
      </div>
    </div>
  );
}

export default CommunityLayout;
