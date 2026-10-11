import { apiFetch } from './apiClient';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AuthorDto {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  badge?: string;
  reputation?: number;
  followersCount?: number;
}

export interface TradingIdeaDto {
  id: string;
  title: string;
  symbol: string;
  assetClass: string;
  timeframe: string;
  direction: 'long' | 'short' | 'neutral';
  entryPrice?: number;
  targetPrice?: number;
  stopLossPrice?: number;
  coverImage?: string;
  videoDuration?: string;
  summary?: string;
  content: string;
  backtestRunId?: number;
  author: AuthorDto;
  likes: number;
  comments: number;
  boosts: number;
  views: number;
  tags?: string[];
  isEditorsPick?: boolean;
  createdAt: string;
  hasLiked?: boolean;
  hasBoosted?: boolean;
  hasBookmarked?: boolean;
  isFollowingAuthor?: boolean;
}

export interface IdeaCommentDto {
  id: string;
  ideaId: number;
  author: AuthorDto;
  content: string;
  likes: number;
  hasLiked?: boolean;
  createdAt: string;
}

export interface PostDto {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  content: string;
  media?: string[];
  privacy: string;
  groupId?: number;
  reactions: Record<string, number>;
  userReaction?: string;
  totalReactions: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
}

export interface PostCommentDto {
  id: string;
  postId: number;
  parentId?: number;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  content: string;
  likes: number;
  hasLiked?: boolean;
  replyCount: number;
  replies?: PostCommentDto[];
  createdAt: string;
}

export interface GroupDto {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  privacy: 'public' | 'private';
  memberCount: number;
  isMember: boolean;
  isPendingApproval: boolean;
  role?: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

export interface GroupMemberDto {
  id: string;
  groupId: number;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  role: 'ADMIN' | 'MEMBER';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  joinedAt: string;
}

export interface UserProfileDto {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  badge?: string;
  reputation: number;
  followersCount: number;
  followingCount: number;
  ideasCount: number;
  isOnline: boolean;
  isFriend: boolean;
  friendStatus: 'not_friend' | 'pending_sent' | 'pending_received' | 'friends';
  isFollowing: boolean;
  createdAt: string;
}

export interface FriendshipDto {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  status: 'friends' | 'pending_sent' | 'pending_received' | 'not_friend';
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  type: string;
  actor: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  message: string;
  referenceId?: number;
  referenceType?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateIdeaPayload {
  title: string;
  symbol: string;
  assetClass: string;
  timeframe?: string;
  direction: string;
  entryPrice?: number;
  targetPrice?: number;
  stopLossPrice?: number;
  coverImage?: string;
  videoDuration?: string;
  summary?: string;
  content: string;
  backtestRunId?: number;
  tags?: string[];
}

export const communityApi = {
  // === TRADING IDEAS ===
  async getIdeas(params?: {
    category?: string;
    query?: string;
    sort?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<TradingIdeaDto>> {
    const sp = new URLSearchParams();
    if (params?.category) sp.set('category', params.category);
    if (params?.query) sp.set('query', params.query);
    if (params?.sort) sp.set('sort', params.sort);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const res = await apiFetch<ApiResponse<PageResponse<TradingIdeaDto>>>(
      `/api/community/ideas?${sp.toString()}`
    );
    return res.data;
  },

  async getIdeaById(id: string | number): Promise<TradingIdeaDto> {
    const res = await apiFetch<ApiResponse<TradingIdeaDto>>(`/api/community/ideas/${id}`);
    return res.data;
  },

  async getIdeaComments(id: string | number): Promise<IdeaCommentDto[]> {
    const res = await apiFetch<ApiResponse<IdeaCommentDto[]>>(`/api/community/ideas/${id}/comments`);
    return res.data;
  },

  async getRelatedIdeas(id: string | number): Promise<TradingIdeaDto[]> {
    const res = await apiFetch<ApiResponse<TradingIdeaDto[]>>(`/api/community/ideas/${id}/related`);
    return res.data;
  },

  async getAuthorIdeas(id: string | number, authorId: string | number): Promise<TradingIdeaDto[]> {
    const res = await apiFetch<ApiResponse<TradingIdeaDto[]>>(
      `/api/community/ideas/${id}/author-ideas?authorId=${authorId}`
    );
    return res.data;
  },

  async getBookmarkedIdeas(page = 0, size = 12): Promise<PageResponse<TradingIdeaDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<TradingIdeaDto>>>(
      `/api/community/ideas/bookmarked?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getIdeasBySymbol(symbol: string, page = 0, size = 12): Promise<PageResponse<TradingIdeaDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<TradingIdeaDto>>>(
      `/api/community/ideas/symbol/${encodeURIComponent(symbol)}?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getUserIdeas(userId: string | number, page = 0, size = 12): Promise<PageResponse<TradingIdeaDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<TradingIdeaDto>>>(
      `/api/community/ideas/user/${userId}?page=${page}&size=${size}`
    );
    return res.data;
  },

  async createIdea(payload: CreateIdeaPayload): Promise<TradingIdeaDto> {
    const res = await apiFetch<ApiResponse<TradingIdeaDto>>('/api/community/ideas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateIdea(id: string | number, payload: Partial<CreateIdeaPayload>): Promise<TradingIdeaDto> {
    const res = await apiFetch<ApiResponse<TradingIdeaDto>>(`/api/community/ideas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteIdea(id: string | number): Promise<void> {
    await apiFetch<ApiResponse<void>>(`/api/community/ideas/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleLikeIdea(id: string | number): Promise<TradingIdeaDto> {
    const res = await apiFetch<ApiResponse<TradingIdeaDto>>(`/api/community/ideas/${id}/like`, {
      method: 'POST',
    });
    return res.data;
  },

  async boostIdea(id: string | number): Promise<TradingIdeaDto> {
    const res = await apiFetch<ApiResponse<TradingIdeaDto>>(`/api/community/ideas/${id}/boost`, {
      method: 'POST',
    });
    return res.data;
  },

  async toggleBookmarkIdea(id: string | number): Promise<TradingIdeaDto> {
    const res = await apiFetch<ApiResponse<TradingIdeaDto>>(`/api/community/ideas/${id}/bookmark`, {
      method: 'POST',
    });
    return res.data;
  },

  async addIdeaComment(id: string | number, content: string): Promise<IdeaCommentDto> {
    const res = await apiFetch<ApiResponse<IdeaCommentDto>>(`/api/community/ideas/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return res.data;
  },

  async deleteIdeaComment(ideaId: string | number, commentId: string | number): Promise<void> {
    await apiFetch<ApiResponse<void>>(`/api/community/ideas/${ideaId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  async toggleIdeaCommentLike(commentId: string | number): Promise<IdeaCommentDto> {
    const res = await apiFetch<ApiResponse<IdeaCommentDto>>(
      `/api/community/ideas/comments/${commentId}/like`,
      { method: 'POST' }
    );
    return res.data;
  },

  // === POSTS & FEED ===
  async getFeed(page = 0, size = 10): Promise<PageResponse<PostDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<PostDto>>>(
      `/api/community/posts?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getPosts(params?: { page?: number; size?: number }): Promise<PageResponse<PostDto>> {
    return this.getFeed(params?.page ?? 0, params?.size ?? 10);
  },

  async getFriendsFeed(page = 0, size = 10): Promise<PageResponse<PostDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<PostDto>>>(
      `/api/community/posts/friends?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getUserPosts(userId: string | number, page = 0, size = 10): Promise<PageResponse<PostDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<PostDto>>>(
      `/api/community/posts/user/${userId}?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getGroupPosts(groupId: string | number, page = 0, size = 10): Promise<PageResponse<PostDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<PostDto>>>(
      `/api/community/posts/group/${groupId}?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getPostById(id: string | number): Promise<PostDto> {
    const res = await apiFetch<ApiResponse<PostDto>>(`/api/community/posts/${id}`);
    return res.data;
  },

  async createPost(payload: {
    content: string;
    media?: string[];
    privacy?: string;
    groupId?: number;
  }): Promise<PostDto> {
    const res = await apiFetch<ApiResponse<PostDto>>('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updatePost(
    id: string | number,
    payload: { content?: string; media?: string[]; privacy?: string }
  ): Promise<PostDto> {
    const res = await apiFetch<ApiResponse<PostDto>>(`/api/community/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deletePost(id: string | number): Promise<void> {
    await apiFetch<ApiResponse<void>>(`/api/community/posts/${id}`, {
      method: 'DELETE',
    });
  },

  async reactToPost(id: string | number, reactionType: string): Promise<PostDto> {
    const res = await apiFetch<ApiResponse<PostDto>>(`/api/community/posts/${id}/react`, {
      method: 'POST',
      body: JSON.stringify({ type: reactionType }),
    });
    return res.data;
  },

  async reactPost(id: string | number, reactionType: string): Promise<PostDto> {
    return this.reactToPost(id, reactionType);
  },

  async getPostComments(id: string | number): Promise<PostCommentDto[]> {
    const res = await apiFetch<ApiResponse<PostCommentDto[]>>(`/api/community/posts/${id}/comments`);
    return res.data;
  },

  async addPostComment(
    id: string | number,
    content: string,
    parentId?: number
  ): Promise<PostCommentDto> {
    const res = await apiFetch<ApiResponse<PostCommentDto>>(`/api/community/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
    return res.data;
  },

  async deletePostComment(postId: string | number, commentId: string | number): Promise<void> {
    await apiFetch<ApiResponse<void>>(`/api/community/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  async togglePostCommentLike(commentId: string | number): Promise<PostCommentDto> {
    const res = await apiFetch<ApiResponse<PostCommentDto>>(
      `/api/community/posts/comments/${commentId}/like`,
      { method: 'POST' }
    );
    return res.data;
  },

  // === GROUPS ===
  async getGroups(query?: string, page = 0, size = 10): Promise<PageResponse<GroupDto>> {
    const sp = new URLSearchParams();
    if (query) sp.set('query', query);
    sp.set('page', String(page));
    sp.set('size', String(size));
    const res = await apiFetch<ApiResponse<PageResponse<GroupDto>>>(
      `/api/community/groups?${sp.toString()}`
    );
    return res.data;
  },

  async getGroupById(id: string | number): Promise<GroupDto> {
    const res = await apiFetch<ApiResponse<GroupDto>>(`/api/community/groups/${id}`);
    return res.data;
  },

  async getMyGroups(): Promise<GroupDto[]> {
    const res = await apiFetch<ApiResponse<GroupDto[]>>('/api/community/groups/my');
    return res.data;
  },

  async createGroup(payload: {
    name: string;
    description?: string;
    coverUrl?: string;
    privacy?: string;
  }): Promise<GroupDto> {
    const res = await apiFetch<ApiResponse<GroupDto>>('/api/community/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateGroup(
    id: string | number,
    payload: { name?: string; description?: string; coverUrl?: string; privacy?: string }
  ): Promise<GroupDto> {
    const res = await apiFetch<ApiResponse<GroupDto>>(`/api/community/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteGroup(id: string | number): Promise<void> {
    await apiFetch<ApiResponse<void>>(`/api/community/groups/${id}`, {
      method: 'DELETE',
    });
  },

  async joinGroup(id: string | number): Promise<GroupDto> {
    const res = await apiFetch<ApiResponse<GroupDto>>(`/api/community/groups/${id}/join`, {
      method: 'POST',
    });
    return res.data;
  },

  async leaveGroup(id: string | number): Promise<GroupDto> {
    const res = await apiFetch<ApiResponse<GroupDto>>(`/api/community/groups/${id}/leave`, {
      method: 'POST',
    });
    return res.data;
  },

  async getGroupMembers(id: string | number, status?: string): Promise<GroupMemberDto[]> {
    const query = status ? `?status=${status}` : '';
    const res = await apiFetch<ApiResponse<GroupMemberDto[]>>(
      `/api/community/groups/${id}/members${query}`
    );
    return res.data;
  },

  async getPendingMembers(id: string | number): Promise<GroupMemberDto[]> {
    const res = await apiFetch<ApiResponse<GroupMemberDto[]>>(
      `/api/community/groups/${id}/members/pending`
    );
    return res.data;
  },

  async respondMemberRequest(
    groupId: string | number,
    targetUserId: string | number,
    approve: boolean | string
  ): Promise<GroupMemberDto> {
    const isApproved = approve === true || String(approve).toUpperCase() === 'APPROVE';
    const res = await apiFetch<ApiResponse<GroupMemberDto>>(
      `/api/community/groups/${groupId}/members/${targetUserId}/respond?approve=${isApproved}`,
      { method: 'POST' }
    );
    return res.data;
  },

  async respondGroupRequest(
    groupId: string | number,
    targetUserId: string | number,
    action: boolean | string
  ): Promise<GroupMemberDto> {
    return this.respondMemberRequest(groupId, targetUserId, action);
  },

  async removeGroupMember(
    groupId: string | number,
    targetUserId: string | number
  ): Promise<void> {
    await apiFetch<ApiResponse<void>>(
      `/api/community/groups/${groupId}/members/${targetUserId}`,
      { method: 'DELETE' }
    );
  },

  async promoteGroupMember(
    groupId: string | number,
    targetUserId: string | number
  ): Promise<GroupMemberDto> {
    const res = await apiFetch<ApiResponse<GroupMemberDto>>(
      `/api/community/groups/${groupId}/members/${targetUserId}/promote`,
      { method: 'POST' }
    );
    return res.data;
  },

  // === FRIENDS & SOCIAL ===
  async sendFriendRequest(targetUserId: string | number): Promise<FriendshipDto> {
    const res = await apiFetch<ApiResponse<FriendshipDto>>(
      `/api/community/friends/request/${targetUserId}`,
      { method: 'POST' }
    );
    return res.data;
  },

  async cancelFriendRequest(targetUserId: string | number): Promise<void> {
    await apiFetch<ApiResponse<void>>(
      `/api/community/friends/request/${targetUserId}`,
      { method: 'DELETE' }
    );
  },

  async getFriendshipStatus(targetUserId: string | number): Promise<FriendshipDto> {
    const res = await apiFetch<ApiResponse<FriendshipDto>>(
      `/api/community/friends/status/${targetUserId}`
    );
    return res.data;
  },

  async respondFriendRequest(friendshipId: string | number, accept: boolean | string): Promise<FriendshipDto> {
    const isAccepted = accept === true || String(accept).toUpperCase() === 'ACCEPT';
    const res = await apiFetch<ApiResponse<FriendshipDto>>(
      `/api/community/friends/${friendshipId}/respond?accept=${isAccepted}`,
      { method: 'POST' }
    );
    return res.data;
  },

  async removeFriend(targetUserId: string | number): Promise<void> {
    await apiFetch<ApiResponse<void>>(`/api/community/friends/${targetUserId}`, {
      method: 'DELETE',
    });
  },

  async unfriend(targetUserId: string | number): Promise<void> {
    return this.removeFriend(targetUserId);
  },

  async getFriends(page = 0, size = 20): Promise<PageResponse<FriendshipDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<FriendshipDto>>>(
      `/api/community/friends?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getPendingFriendRequests(page = 0, size = 20): Promise<PageResponse<FriendshipDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<FriendshipDto>>>(
      `/api/community/friends/pending?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getFriendRequests(page = 0, size = 20): Promise<PageResponse<FriendshipDto>> {
    return this.getPendingFriendRequests(page, size);
  },

  async getSentFriendRequests(page = 0, size = 20): Promise<PageResponse<FriendshipDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<FriendshipDto>>>(
      `/api/community/friends/sent?page=${page}&size=${size}`
    );
    return res.data;
  },

  async followUser(targetUserId: string | number): Promise<boolean> {
    const res = await apiFetch<ApiResponse<boolean>>(
      `/api/community/follow/${targetUserId}`,
      { method: 'POST' }
    );
    return res.data;
  },

  async unfollowUser(targetUserId: string | number): Promise<boolean> {
    const res = await apiFetch<ApiResponse<boolean>>(
      `/api/community/follow/${targetUserId}`,
      { method: 'DELETE' }
    );
    return res.data;
  },

  async getFollowers(userId: string | number, page = 0, size = 20): Promise<PageResponse<UserProfileDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<UserProfileDto>>>(
      `/api/community/followers/${userId}?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getFollowing(userId: string | number, page = 0, size = 20): Promise<PageResponse<UserProfileDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<UserProfileDto>>>(
      `/api/community/following/${userId}?page=${page}&size=${size}`
    );
    return res.data;
  },

  // === USER PROFILE ===
  async getMyProfile(): Promise<UserProfileDto> {
    const res = await apiFetch<ApiResponse<UserProfileDto>>('/api/community/profile/me');
    return res.data;
  },

  async getProfileById(userId: string | number): Promise<UserProfileDto> {
    const res = await apiFetch<ApiResponse<UserProfileDto>>(`/api/community/profile/${userId}`);
    return res.data;
  },

  async getProfileByUsername(username: string): Promise<UserProfileDto> {
    const res = await apiFetch<ApiResponse<UserProfileDto>>(
      `/api/community/profile/by-username/${encodeURIComponent(username)}`
    );
    return res.data;
  },

  async updateProfile(payload: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    badge?: string;
  }): Promise<UserProfileDto> {
    const res = await apiFetch<ApiResponse<UserProfileDto>>('/api/community/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateMyProfile(payload: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    badge?: string;
  }): Promise<UserProfileDto> {
    return this.updateProfile(payload);
  },

  // === NOTIFICATIONS ===
  async getNotifications(page = 0, size = 20): Promise<PageResponse<NotificationDto>> {
    const res = await apiFetch<ApiResponse<PageResponse<NotificationDto>>>(
      `/api/community/notifications?page=${page}&size=${size}`
    );
    return res.data;
  },

  async getUnreadNotificationCount(): Promise<number> {
    const res = await apiFetch<ApiResponse<number>>('/api/community/notifications/unread-count');
    return res.data;
  },

  async markNotificationAsRead(id: string | number): Promise<void> {
    await apiFetch<ApiResponse<void>>(`/api/community/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  async markAllNotificationsAsRead(): Promise<void> {
    await apiFetch<ApiResponse<void>>('/api/community/notifications/read-all', {
      method: 'POST',
    });
  },
};
