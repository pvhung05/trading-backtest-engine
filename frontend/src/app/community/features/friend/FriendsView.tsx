import { useState, useEffect } from 'react';
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
} from 'lucide-react';

export function FriendsView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'received' | 'sent' | 'add'>('friends');
  const [friends, setFriends] = useState<User[]>(mockUserList.slice(0, 3));
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>(mockFriendRequests);
  const [sentRequests, setSentRequests] = useState<FriendResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Add friend search input
  const [targetUserIdInput, setTargetUserIdInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        communityApi.getFriends().catch(() => []),
        communityApi.getFriendRequests().catch(() => []),
        communityApi.getSentFriendRequests().catch(() => []),
      ]);

      if (friendsRes && friendsRes.length > 0) {
        setFriends(
          friendsRes.map((f) => ({
            id: String(f.id),
            name: f.friendName || f.friendUsername || 'Trader',
            avatarUrl: f.friendAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
            email: f.friendUsername ? `@${f.friendUsername}` : undefined,
            isOnline: true,
          }))
        );
      }

      if (receivedRes && receivedRes.length > 0) {
        setReceivedRequests(
          receivedRes.map((r) => ({
            id: String(r.id),
            from: {
              id: String(r.friendId),
              name: r.friendName || r.friendUsername || 'Trader',
              avatarUrl: r.friendAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
            },
            to: defaultUser,
            status: 'pending',
            createdAt: r.createdAt || new Date().toISOString(),
          }))
        );
      }

      if (sentRes && sentRes.length > 0) {
        setSentRequests(sentRes);
      }
    } catch (err) {
      console.warn('Friends data API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptRequest = async (reqId: string, senderId: string) => {
    const numId = Number(senderId);
    if (!isNaN(numId)) {
      try {
        await communityApi.respondFriendRequest(numId, 'ACCEPT');
      } catch (err) {
        console.warn('Accept friend error:', err);
      }
    }
    const accepted = receivedRequests.find((r) => r.id === reqId);
    if (accepted) {
      setFriends((prev) => [accepted.from, ...prev]);
    }
    setReceivedRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleDeclineRequest = async (reqId: string, senderId: string) => {
    const numId = Number(senderId);
    if (!isNaN(numId)) {
      try {
        await communityApi.respondFriendRequest(numId, 'DECLINE');
      } catch (err) {
        console.warn('Decline friend error:', err);
      }
    }
    setReceivedRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleCancelSentRequest = async (receiverId: number) => {
    try {
      await communityApi.cancelFriendRequest(receiverId);
      setSentRequests((prev) => prev.filter((r) => r.friendId !== receiverId));
    } catch (err) {
      console.warn('Cancel sent request failed:', err);
    }
  };

  const handleUnfriend = async (friendId: string) => {
    const numId = Number(friendId);
    if (!isNaN(numId)) {
      try {
        await communityApi.unfriend(numId);
      } catch (err) {
        console.warn('Unfriend error:', err);
      }
    }
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
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
      setFeedbackMsg({ text: 'Không thể gửi lời mời hoặc người dùng không tồn tại.', type: 'error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1e222d] p-5 rounded-2xl border border-gray-200/80 dark:border-[#2a2e39] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="size-6 text-blue-600" />
            <span>Mạng Lưới Bạn Bè & Kết Nối Giao Dịch</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mở rộng vòng kết nối trader, theo dõi chiến lược và thảo luận riêng tư cùng đồng đội.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-gray-500 hover:text-blue-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Làm mới"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#2a2e39] pb-2 overflow-x-auto">
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

      {/* Tab Contents */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {friends.length > 0 ? (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={friend.avatarUrl}
                    alt={friend.name}
                    className="size-11 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {friend.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{friend.email || '@trader'}</p>
                  </div>
                </div>

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
            <div className="col-span-full py-12 text-center text-gray-500 text-sm">
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
                className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.from.avatarUrl}
                    alt={req.from.name}
                    className="size-11 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{req.from.name}</p>
                    <p className="text-xs text-gray-500">Đã gửi lời mời kết bạn</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptRequest(req.id, req.from.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    <Check className="size-4" />
                    <span>Chấp nhận</span>
                  </button>
                  <button
                    onClick={() => handleDeclineRequest(req.id, req.from.id)}
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
                className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.friendAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'}
                    alt={req.friendName || 'User'}
                    className="size-11 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {req.friendName || req.friendUsername || `User #${req.friendId}`}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Đang chờ đối phương chấp nhận</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCancelSentRequest(req.friendId)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
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
