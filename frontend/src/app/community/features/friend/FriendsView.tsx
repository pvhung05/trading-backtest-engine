import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { User, FriendRequest } from '../../types';
import { users as mockUserList, mockFriendRequests, currentUser as defaultUser } from '../../data/mock';
import { communityApi, type FriendResponse } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import {
  Users,
  UserCheck,
  UserPlus,
  Send,
  X,
  Check,
  Search,
  UserMinus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export function FriendsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'received' | 'sent' | 'add'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Add friend search input
  const [targetUserIdInput, setTargetUserIdInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        communityApi.getFriends().catch(() => null),
        communityApi.getPendingFriendRequests().catch(() => null),
        communityApi.getSentFriendRequests().catch(() => null),
      ]);

      const extractList = (res: any) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.content)) return res.content;
        return [];
      };

      const friendsList = extractList(friendsRes);
      const receivedList = extractList(receivedRes);
      const sentList = extractList(sentRes);

      setFriends(
        friendsList.map((f: any) => ({
          id: String(f.user?.id || f.id),
          name: f.user?.name || f.friendName || f.friendUsername || `User #${f.user?.id || f.id}`,
          avatarUrl: f.user?.avatarUrl || f.friendAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
          email: f.user?.username ? `@${f.user.username}` : (f.friendUsername ? `@${f.friendUsername}` : undefined),
          isOnline: true,
        }))
      );

      setReceivedRequests(
        receivedList.map((r: any) => ({
          id: String(r.id), // Friendship ID
          from: {
            id: String(r.user?.id || r.friendId || '1'),
            name: r.user?.name || r.friendName || r.friendUsername || `User #${r.user?.id || '1'}`,
            avatarUrl: r.user?.avatarUrl || r.friendAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
          },
          to: defaultUser,
          status: 'pending',
          createdAt: r.createdAt ? String(r.createdAt) : new Date().toISOString(),
        }))
      );

      setSentRequests(
        sentList.map((s: any) => ({
          id: String(s.id),
          friendId: Number(s.user?.id || s.friendId),
          friendName: s.user?.name || s.friendName || `User #${s.user?.id}`,
          friendUsername: s.user?.username || s.friendUsername,
          friendAvatar: s.user?.avatarUrl || s.friendAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
          status: 'PENDING',
          createdAt: s.createdAt ? String(s.createdAt) : new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.warn('Friends data API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptRequest = async (reqId: string) => {
    const friendshipId = Number(reqId);
    if (!isNaN(friendshipId)) {
      try {
        await communityApi.respondFriendRequest(friendshipId, true);
        const accepted = receivedRequests.find((r) => r.id === reqId);
        if (accepted) {
          setFriends((prev) => [accepted.from, ...prev]);
        }
        setReceivedRequests((prev) => prev.filter((r) => r.id !== reqId));
      } catch (err) {
        console.warn('Accept friend error:', err);
      }
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    const friendshipId = Number(reqId);
    if (!isNaN(friendshipId)) {
      try {
        await communityApi.respondFriendRequest(friendshipId, false);
        setReceivedRequests((prev) => prev.filter((r) => r.id !== reqId));
      } catch (err) {
        console.warn('Decline friend error:', err);
      }
    }
  };

  const handleCancelSentRequest = async (targetUserId: number) => {
    try {
      await communityApi.cancelFriendRequest(targetUserId);
      setSentRequests((prev) => prev.filter((r) => r.friendId !== targetUserId));
    } catch (err) {
      console.warn('Cancel sent request failed:', err);
    }
  };

  const handleUnfriend = async (friendUserId: string) => {
    const numId = Number(friendUserId);
    if (!isNaN(numId)) {
      try {
        await communityApi.removeFriend(numId);
        setFriends((prev) => prev.filter((f) => f.id !== friendUserId));
      } catch (err) {
        console.warn('Unfriend error:', err);
      }
    }
  };

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = Number(targetUserIdInput.trim());
    if (isNaN(targetId) || targetId <= 0) {
      setFeedbackMsg({ text: 'Vui lòng nhập ID người dùng là số nguyên hợp lệ!', type: 'error' });
      return;
    }

    try {
      await communityApi.sendFriendRequest(targetId);
      setFeedbackMsg({ text: `Đã gửi lời mời kết bạn tới User #${targetId} thành công!`, type: 'success' });
      setTargetUserIdInput('');
      loadData();
    } catch (err: any) {
      setFeedbackMsg({ text: 'Không thể gửi lời mời hoặc bạn đã gửi/đã là bạn bè với người dùng này.', type: 'error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-[#2a2e39] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <UserCheck className="size-4" />
            <span>Bạn bè ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'received'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <UserPlus className="size-4" />
            <span>Lời mời đã nhận ({receivedRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'sent'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Send className="size-4" />
            <span>Lời mời đã gửi ({sentRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'add'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Search className="size-4" />
            <span>Kết bạn mới</span>
          </button>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-gray-500 hover:text-blue-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
          title="Làm mới danh sách bạn bè"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 group hover:border-blue-500/40 transition-all"
              >
                <Link
                  to={`/community/profile/${friend.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 transition-opacity"
                >
                  <img
                    src={friend.avatarUrl}
                    alt={friend.name}
                    className="size-11 rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {friend.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{friend.email || `@user${friend.id}`}</p>
                  </div>
                </Link>

                <button
                  onClick={() => handleUnfriend(friend.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Hủy kết bạn"
                >
                  <UserMinus className="size-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 text-sm bg-white dark:bg-[#1e222d] rounded-2xl border border-gray-200 dark:border-[#2a2e39]">
              Bạn chưa có bạn bè nào trong danh sách.
            </div>
          )}
        </div>
      )}

      {activeTab === 'received' && (
        <div className="space-y-3">
          {receivedRequests.length > 0 ? (
            receivedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 group hover:border-blue-500/40 transition-all"
              >
                <Link
                  to={`/community/profile/${req.from.id}`}
                  className="flex items-center gap-3 min-w-0 hover:opacity-85 transition-opacity"
                >
                  <img
                    src={req.from.avatarUrl}
                    alt={req.from.name}
                    className="size-11 rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{req.from.name}</p>
                    <p className="text-xs text-gray-500 truncate">Đã gửi lời mời kết bạn · Xem hồ sơ</p>
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    <Check className="size-4" />
                    <span>Chấp nhận</span>
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <X className="size-4" />
                    <span>Từ chối</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm bg-white dark:bg-[#1e222d] rounded-2xl border border-gray-200 dark:border-[#2a2e39]">
              Không có lời mời kết bạn nào đang chờ duyệt.
            </div>
          )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="space-y-3">
          {sentRequests.length > 0 ? (
            sentRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 group hover:border-blue-500/40 transition-all"
              >
                <Link
                  to={`/community/profile/${req.friendId}`}
                  className="flex items-center gap-3 min-w-0 hover:opacity-85 transition-opacity"
                >
                  <img
                    src={req.friendAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'}
                    alt={req.friendName || 'User'}
                    className="size-11 rounded-full object-cover shrink-0 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {req.friendName || req.friendUsername || `User #${req.friendId}`}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Đang chờ đối phương chấp nhận</p>
                  </div>
                </Link>

                <button
                  onClick={() => handleCancelSentRequest(req.friendId)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                >
                  <X className="size-4" />
                  <span>Hủy lời mời</span>
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm bg-white dark:bg-[#1e222d] rounded-2xl border border-gray-200 dark:border-[#2a2e39]">
              Bạn không có lời mời kết bạn nào đang gửi đi.
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Gửi Lời Mời Kết Bạn Qua User ID
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Nhập ID của người dùng (Ví dụ ID của bạn bè bạn trong hệ thống) để kết nối và cùng theo dõi danh mục chiến lược.
          </p>

          <form onSubmit={handleSendFriendRequest} className="flex gap-3 max-w-md">
            <input
              type="number"
              min="1"
              required
              placeholder="Nhập User ID (ví dụ: 2)"
              value={targetUserIdInput}
              onChange={(e) => setTargetUserIdInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="size-3.5" />
              <span>Gửi lời mời</span>
            </button>
          </form>

          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FriendsView;
