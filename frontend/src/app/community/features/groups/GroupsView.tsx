import { useState, useEffect } from 'react';
import type { Group } from '../../types';
import { mockGroups } from '../../data/mock';
import { communityApi, type GroupResponse, type GroupMemberResponse } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import {
  Users,
  Plus,
  Shield,
  Lock,
  Globe,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
} from 'lucide-react';

function mapBackendGroup(g: GroupResponse): Group {
  return {
    id: String(g.id),
    name: g.name,
    coverUrl: g.coverImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop',
    privacy: (g.privacy?.toLowerCase() as any) || 'public',
    memberCount: g.membersCount || 1,
    isMember: g.isMember || false,
    isPendingApproval: false,
    description: g.description,
    role: (g.userRole as any) || 'MEMBER',
  };
}

export function GroupsView() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Group Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupPrivacy, setGroupPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [groupCover, setGroupCover] = useState('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop');

  // Group Moderation Modal
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);
  const [pendingMembers, setPendingMembers] = useState<GroupMemberResponse[]>([]);
  const [activeMembers, setActiveMembers] = useState<GroupMemberResponse[]>([]);
  const [modalTab, setModalTab] = useState<'pending' | 'members'>('pending');
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await communityApi.getGroups();
      if (res?.content && res.content.length > 0) {
        const liveGroups = res.content.map(mapBackendGroup);
        const liveIds = new Set(liveGroups.map((g) => g.id));
        const filteredMock = mockGroups.filter((g) => !liveIds.has(g.id));
        setGroups([...liveGroups, ...filteredMock]);
      }
    } catch (err) {
      console.warn('Could not load groups from backend API, using initial sample groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleJoinGroup = async (group: Group) => {
    const numId = Number(group.id);
    if (!isNaN(numId)) {
      try {
        await communityApi.joinGroup(numId);
      } catch (err) {
        console.warn('Join group API call failed:', err);
      }
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === group.id) {
          if (g.privacy === 'private') {
            return { ...g, isPendingApproval: true };
          }
          return { ...g, isMember: true, memberCount: g.memberCount + 1 };
        }
        return g;
      })
    );
  };

  const handleLeaveGroup = async (group: Group) => {
    const numId = Number(group.id);
    if (!isNaN(numId)) {
      try {
        await communityApi.leaveGroup(numId);
      } catch (err) {
        console.warn('Leave group API call failed:', err);
      }
    }

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? { ...g, isMember: false, isPendingApproval: false, memberCount: Math.max(0, g.memberCount - 1) }
          : g
      )
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    let newGroupId = `g-${Date.now()}`;
    try {
      const created = await communityApi.createGroup({
        name: groupName.trim(),
        description: groupDesc.trim(),
        privacy: groupPrivacy,
        coverImage: groupCover,
      });
      if (created?.id) newGroupId = String(created.id);
    } catch (err) {
      console.warn('Create group API failed, keeping in local state:', err);
    }

    const createdGroup: Group = {
      id: newGroupId,
      name: groupName.trim(),
      description: groupDesc.trim(),
      privacy: groupPrivacy.toLowerCase() as any,
      coverUrl: groupCover,
      memberCount: 1,
      isMember: true,
      role: 'ADMIN',
    };

    setGroups((prev) => [createdGroup, ...prev]);
    setIsCreateOpen(false);
    setGroupName('');
    setGroupDesc('');
  };

  const openManageModal = async (group: Group) => {
    setManagingGroup(group);
    setLoadingMembers(true);
    const numId = Number(group.id);
    if (!isNaN(numId)) {
      try {
        const [pending, members] = await Promise.all([
          communityApi.getPendingMembers(numId).catch(() => []),
          communityApi.getGroupMembers(numId).catch(() => []),
        ]);
        setPendingMembers(pending);
        setActiveMembers(members);
      } catch (err) {
        console.warn('Error fetching group members for admin:', err);
      }
    } else {
      setPendingMembers([]);
      setActiveMembers([]);
    }
    setLoadingMembers(false);
  };

  const handleRespondPending = async (targetUserId: number, action: 'APPROVE' | 'REJECT') => {
    if (!managingGroup) return;
    try {
      await communityApi.respondGroupRequest(Number(managingGroup.id), targetUserId, action);
      setPendingMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
      if (action === 'APPROVE') {
        setGroups((prev) =>
          prev.map((g) => (g.id === managingGroup.id ? { ...g, memberCount: g.memberCount + 1 } : g))
        );
      }
    } catch (err) {
      console.warn('Respond pending request failed:', err);
    }
  };

  const handleRemoveMember = async (targetUserId: number) => {
    if (!managingGroup) return;
    try {
      await communityApi.removeGroupMember(Number(managingGroup.id), targetUserId);
      setActiveMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
      setGroups((prev) =>
        prev.map((g) => (g.id === managingGroup.id ? { ...g, memberCount: Math.max(1, g.memberCount - 1) } : g))
      );
    } catch (err) {
      console.warn('Remove member failed:', err);
    }
  };

  const displayedGroups = groups.filter((g) => {
    if (filterTab === 'my' && !g.isMember) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return g.name.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1e222d] p-5 rounded-2xl border border-gray-200/80 dark:border-[#2a2e39] shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="size-6 text-blue-600" />
            <span>Nhóm Giao Dịch & Cộng Đồng Chuyên Sâu</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Gia nhập hoặc xây dựng các nhóm trao đổi tín hiệu, chia sẻ chiến thuật backtest thuật toán.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="size-4" />
          <span>Tạo Nhóm Mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#1e222d] p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Tất cả các nhóm
          </button>
          <button
            onClick={() => setFilterTab('my')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterTab === 'my'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Nhóm của tôi ({groups.filter((g) => g.isMember).length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhóm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadGroups}
            className="p-2 text-gray-500 hover:text-blue-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid of Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-2xl overflow-hidden shadow-xs flex flex-col group hover:shadow-md transition-all"
          >
            {/* Cover Image */}
            <div className="h-36 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={group.coverUrl}
                alt={group.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md bg-black/60 text-white">
                {group.privacy === 'private' ? (
                  <>
                    <Lock className="size-3 text-amber-400" />
                    <span>Kín</span>
                  </>
                ) : (
                  <>
                    <Globe className="size-3 text-emerald-400" />
                    <span>Công khai</span>
                  </>
                )}
              </div>
              {group.role === 'ADMIN' && (
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                  <Shield className="size-3" />
                  <span>ADMIN</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                  {group.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  {group.description || 'Chưa có mô tả cho nhóm giao dịch này.'}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <Users className="size-3.5" />
                  <span>{group.memberCount.toLocaleString('vi-VN')} thành viên</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-gray-100 dark:border-[#2a2e39] flex items-center justify-between gap-2">
                {group.role === 'ADMIN' && (
                  <button
                    onClick={() => openManageModal(group)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    Quản lý nhóm
                  </button>
                )}

                <div className="ml-auto">
                  {group.isMember ? (
                    <button
                      onClick={() => handleLeaveGroup(group)}
                      className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Đã tham gia (Rời)
                    </button>
                  ) : group.isPendingApproval ? (
                    <span className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold">
                      Chờ duyệt
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoinGroup(group)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {group.privacy === 'private' ? 'Xin gia nhập' : 'Tham gia'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tạo Nhóm Giao Dịch Mới</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tên nhóm
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phân Tích Kỹ Thuật Crypto Pro"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả nhóm
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục đích nhóm, định hướng chiến lược hoặc quy tắc ứng xử..."
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Chế độ quyền riêng tư
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGroupPrivacy('PUBLIC')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      groupPrivacy === 'PUBLIC'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Globe className="size-4" />
                      <span>Công khai</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Ai cũng có thể thấy và tham gia ngay</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGroupPrivacy('PRIVATE')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      groupPrivacy === 'PRIVATE'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <Lock className="size-4" />
                      <span>Riêng tư</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">Cần Admin xét duyệt trước khi vào nhóm</div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Xác nhận tạo nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Moderation Modal */}
      {managingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2a2e39] pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Quản lý thành viên: {managingGroup.name}
                </h3>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Vai trò: Quản trị viên (Admin)</span>
              </div>
              <button
                onClick={() => setManagingGroup(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2 border-b border-gray-100 dark:border-[#2a2e39] pb-2">
              <button
                onClick={() => setModalTab('pending')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  modalTab === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Chờ xét duyệt ({pendingMembers.length})
              </button>
              <button
                onClick={() => setModalTab('members')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                  modalTab === 'members'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Thành viên chính thức ({activeMembers.length})
              </button>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto space-y-2 py-1">
              {loadingMembers ? (
                <div className="text-center py-8 text-xs text-gray-400">Đang tải danh sách...</div>
              ) : modalTab === 'pending' ? (
                pendingMembers.length > 0 ? (
                  pendingMembers.map((m) => (
                    <div
                      key={m.userId}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={m.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'}
                          alt={m.userName}
                          className="size-9 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{m.userName}</p>
                          <p className="text-[10px] text-gray-500">Yêu cầu gia nhập</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRespondPending(m.userId, 'APPROVE')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <UserCheck className="size-3.5" />
                          <span>Duyệt</span>
                        </button>
                        <button
                          onClick={() => handleRespondPending(m.userId, 'REJECT')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          <UserX className="size-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-xs text-gray-500">Không có yêu cầu chờ duyệt nào.</p>
                )
              ) : activeMembers.length > 0 ? (
                activeMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={m.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'}
                        alt={m.userName}
                        className="size-9 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{m.userName}</p>
                          {m.role === 'ADMIN' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded font-semibold">Admin</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500">{m.userBadge || 'TRADER'}</p>
                      </div>
                    </div>
                    {m.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer"
                      >
                        Gỡ khỏi nhóm
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-xs text-gray-500">Chưa tải được thành viên.</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-[#2a2e39]">
              <button
                onClick={() => setManagingGroup(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupsView;
