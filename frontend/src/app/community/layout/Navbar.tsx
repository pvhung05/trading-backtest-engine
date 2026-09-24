import { useState } from 'react';
import Avatar from '../components/Avatar';
import { BellIcon, SearchIcon, HomeIcon, UsersIcon, GridIcon, LogOutIcon, MoonIcon, SettingsIcon, UserIcon, TrendingUpIcon } from '../components/Icons';
import { currentUser as defaultUser, mockNotifications } from '../data/mock';
import type { User } from '../types';
import { useTheme } from '../../context/ThemeContext';

type Tab = 'feed' | 'friends' | 'groups' | 'notifications';

interface NavbarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  currentUser?: User;
  onBackToTrading?: () => void;
  onLogout?: () => void;
}

const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

export default function Navbar({ activeTab, onTabChange, currentUser = defaultUser, onBackToTrading, onLogout }: NavbarProps) {
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggle: toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-slate-200/80 dark:border-gray-700/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo and Back to Trading Button */}
        <div className="flex items-center gap-2">
          {onBackToTrading && (
            <button
              onClick={onBackToTrading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold transition-all duration-150 cursor-pointer border border-blue-200/50 dark:border-blue-800/50 mr-1"
              title="Quay lại biểu đồ giao dịch & backtest"
            >
              <TrendingUpIcon size={14} />
              <span className="hidden sm:inline">Sàn Giao Dịch</span>
            </button>
          )}

          <a href="#" onClick={(e) => { e.preventDefault(); onTabChange('feed'); }} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xs text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-slate-800 dark:text-gray-100 text-base hidden sm:block">Cộng Đồng</span>
          </a>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs hidden sm:block">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm bài viết, tác giả..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-700/60 text-slate-800 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-slate-200/30 dark:border-gray-600"
          />
        </div>

        {/* Nav tabs - desktop */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {([
            { id: 'feed', label: 'Bảng tin', Icon: HomeIcon },
            { id: 'friends', label: 'Bạn bè', Icon: UsersIcon },
            { id: 'groups', label: 'Nhóm', Icon: GridIcon },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-medium transition-colors cursor-pointer ${
                activeTab === id
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700/50 hover:text-slate-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
              className="relative w-9 h-9 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors text-slate-600 dark:text-gray-300 cursor-pointer"
              aria-label="Thông báo"
            >
              <BellIcon size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-[16px] shadow-xl border border-slate-100 dark:border-gray-700 py-2 z-40 pop-in">
                <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 dark:border-gray-700/60">
                  <h3 className="font-bold text-slate-800 dark:text-gray-100 text-sm">Thông báo</h3>
                  <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">Đánh dấu đã đọc</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {mockNotifications.map((n) => (
                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                      <img src={n.actor.avatarUrl} alt={n.actor.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" loading="lazy" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-gray-300">
                          <span className="font-semibold text-slate-900 dark:text-gray-100">{n.actor.name}</span>{' '}
                          {n.message}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      {!n.isRead && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avatar / menu */}
          <div className="relative">
            <button
              onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-800 transition-all cursor-pointer"
              aria-label="Menu tài khoản"
            >
              <Avatar user={currentUser} size="sm" showOnline />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-100 dark:border-gray-700 p-2 z-40 pop-in">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-gray-700/60">
                  <p className="font-bold text-slate-800 dark:text-gray-100 text-sm truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-400 truncate mt-0.5">{currentUser.email}</p>
                </div>
                <div className="pt-1 space-y-0.5">
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
                  >
                    <UserIcon size={16} className="text-slate-500 dark:text-gray-400" />
                    <span>Trang cá nhân</span>
                  </button>

                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
                  >
                    <SettingsIcon size={16} className="text-slate-500 dark:text-gray-400" />
                    <span>Cài đặt</span>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <MoonIcon size={16} className="text-slate-500 dark:text-gray-400" />
                      <span>Chế độ tối</span>
                    </div>
                    <span className={`inline-block w-3.5 h-3.5 rounded-full ${isDark ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => { setMenuOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <LogOutIcon size={16} className="text-red-500 dark:text-red-400" />
                      <span>Đăng xuất</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700 flex z-30">
        {([
          { id: 'feed', Icon: HomeIcon, label: 'Home' },
          { id: 'friends', Icon: UsersIcon, label: 'Bạn bè' },
          { id: 'groups', Icon: GridIcon, label: 'Nhóm' },
          { id: 'notifications', Icon: BellIcon, label: 'Thông báo', badge: unreadCount },
        ] as const).map(({ id, Icon, label, ...rest }) => {
          const badge = 'badge' in rest ? rest.badge : 0;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 relative transition-colors cursor-pointer ${
                activeTab === id ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400 dark:text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
              {badge > 0 && (
                <span className="absolute top-1.5 right-1/4 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
