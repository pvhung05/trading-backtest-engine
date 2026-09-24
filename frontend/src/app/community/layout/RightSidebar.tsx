import Avatar from '../components/Avatar';
import FriendButton from '../features/friend/FriendButton';
import { PlusIcon, LockIcon, GlobeIcon } from '../components/Icons';
import { suggestedFriends, mockGroups, mockFriendRequests } from '../data/mock';

export default function RightSidebar() {
  return (
    <aside className="hidden xl:block w-64 flex-shrink-0">
      <div className="sticky top-20 space-y-4">

        {/* Friend requests */}
        {mockFriendRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-[16px] p-4 shadow-sm border border-slate-100 dark:border-gray-700/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-gray-100 text-sm">Lời mời kết bạn</h3>
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Xem tất cả</button>
            </div>
            {mockFriendRequests.map((req) => (
              <div key={req.id} className="flex items-center gap-3">
                <Avatar user={req.from} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-100 truncate">{req.from.name}</p>
                  <div className="flex gap-2 mt-1.5">
                    <FriendButton initialStatus="pending_received" userName={req.from.name} />
                    <button className="px-3 py-1 rounded-[8px] text-xs font-medium bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                      Từ chối
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested friends */}
        <div className="bg-white dark:bg-gray-800 rounded-[16px] p-4 shadow-sm border border-slate-100 dark:border-gray-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-gray-100 text-sm">Gợi ý kết bạn</h3>
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Xem tất cả</button>
          </div>
          <div className="space-y-3">
            {suggestedFriends.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar user={user} size="md" showOnline />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-100 truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-400">3 bạn chung</p>
                </div>
                <FriendButton initialStatus="not_friend" userName={user.name} />
              </div>
            ))}
          </div>
        </div>

        {/* Suggested groups */}
        <div className="bg-white dark:bg-gray-800 rounded-[16px] p-4 shadow-sm border border-slate-100 dark:border-gray-700/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 dark:text-gray-100 text-sm">Nhóm gợi ý</h3>
          </div>
          <div className="space-y-3">
            {mockGroups.filter((g) => !g.isMember).map((group) => (
              <div key={group.id} className="flex gap-3">
                <img
                  src={group.coverUrl}
                  alt={group.name}
                  loading="lazy"
                  className="w-12 h-12 rounded-[12px] object-cover bg-slate-100 dark:bg-gray-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-100 truncate">{group.name}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-400 flex items-center gap-1">
                    {group.privacy === 'private'
                      ? <><LockIcon size={11} className="inline" /> Nhóm riêng tư</>
                      : <><GlobeIcon size={11} className="inline" /> Nhóm công khai</>}
                    {' · '}{group.memberCount.toLocaleString('vi-VN')} thành viên
                  </p>
                  <button className="mt-1.5 flex items-center gap-1 px-3 py-1 rounded-[8px] text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                    <PlusIcon size={12} />
                    Tham gia
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Online friends */}
        <div className="bg-white dark:bg-gray-800 rounded-[16px] p-4 shadow-sm border border-slate-100 dark:border-gray-700/60">
          <h3 className="font-semibold text-slate-800 dark:text-gray-100 text-sm mb-3">Bạn bè đang online</h3>
          <div className="space-y-2">
            {suggestedFriends.filter((u) => u.isOnline).map((user) => (
              <button key={user.id} className="w-full flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-gray-700/50 rounded-[8px] px-1 py-1 transition-colors cursor-pointer">
                <Avatar user={user} size="sm" showOnline />
                <span className="text-sm text-slate-700 dark:text-gray-200 truncate">{user.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
