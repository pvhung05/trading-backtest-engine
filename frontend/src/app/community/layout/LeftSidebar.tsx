import Avatar from '../components/Avatar';
import { HomeIcon, UserIcon, UsersIcon, GridIcon, CalendarIcon, BookmarkIcon, SettingsIcon } from '../components/Icons';
import { currentUser as defaultUser, mockGroups } from '../data/mock';
import type { User } from '../types';

const navItems = [
  { Icon: HomeIcon, label: 'Trang chủ' },
  { Icon: UserIcon, label: 'Trang cá nhân' },
  { Icon: UsersIcon, label: 'Bạn bè' },
  { Icon: GridIcon, label: 'Nhóm' },
  { Icon: CalendarIcon, label: 'Sự kiện' },
  { Icon: BookmarkIcon, label: 'Đã lưu' },
  { Icon: SettingsIcon, label: 'Cài đặt' },
];

interface LeftSidebarProps {
  currentUser?: User;
}

export default function LeftSidebar({ currentUser = defaultUser }: LeftSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-20 space-y-2">
        {/* Profile shortcut */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <Avatar user={currentUser} size="md" showOnline />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-gray-100 truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-400 dark:text-gray-400 truncate">Xem trang cá nhân</p>
          </div>
        </a>

        <div className="h-px bg-slate-200 dark:bg-gray-700/60 mx-3" />

        {/* Nav */}
        <nav className="space-y-0.5">
          {navItems.map(({ Icon, label }) => (
            <button
              key={label}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <Icon size={18} className="flex-shrink-0 text-slate-500 dark:text-gray-400" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="h-px bg-slate-200 dark:bg-gray-700/60 mx-3" />

        {/* Groups */}
        <div>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Nhóm của bạn</span>
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Xem tất cả</button>
          </div>
          {mockGroups.filter((g) => g.isMember).map((group) => (
            <button
              key={group.id}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-[12px] hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <img
                src={group.coverUrl}
                alt={group.name}
                loading="lazy"
                className="w-8 h-8 rounded-[8px] object-cover bg-slate-200 dark:bg-gray-700 flex-shrink-0"
              />
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate">{group.name}</p>
                <p className="text-xs text-slate-400 dark:text-gray-400">{group.memberCount.toLocaleString('vi-VN')} thành viên</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
