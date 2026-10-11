import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { communityApi, type UserProfileDto, type PostDto, type TradingIdeaDto } from '../services';
import type { TradingIdea, Post, ReactionType } from '../community/types';
import { IdeaCard } from '../community/components/IdeaCard';
import PostCard from '../community/features/feed/PostCard';
import { ProfileEditModal } from '../community/components/ProfileEditModal';
import {
  ArrowLeft,
  Camera,
  Edit3,
  Calendar,
  MapPin,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Users,
  Award,
  Layers,
  MessageSquare,
  Clock,
  Globe,
  Share2,
  UserPlus,
  UserCheck,
  UserX,
  Check,
} from 'lucide-react';

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=1600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&h=600&fit=crop&auto=format',
];

type TimelineTab = 'all' | 'ideas' | 'posts' | 'about';

interface TimelineItem {
  id: string;
  type: 'idea' | 'post';
  date: string; // ISO date
  dateHeader: string; // Group title e.g. "Hôm nay", "Tháng 10, 2026"
  ideaData?: TradingIdea;
  postData?: Post;
}

function formatDateHeader(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

function mapBackendPost(p: PostDto): Post {
  const rawReactions = p.reactions || {};
  const counts: Record<ReactionType, number> = {
    like: rawReactions['like'] ?? (p as any).reactionsCount?.['LIKE'] ?? 0,
    love: rawReactions['love'] ?? (p as any).reactionsCount?.['LOVE'] ?? 0,
    haha: rawReactions['haha'] ?? (p as any).reactionsCount?.['HAHA'] ?? 0,
    wow: rawReactions['wow'] ?? (p as any).reactionsCount?.['WOW'] ?? 0,
    sad: rawReactions['sad'] ?? (p as any).reactionsCount?.['SAD'] ?? 0,
    angry: rawReactions['angry'] ?? (p as any).reactionsCount?.['ANGRY'] ?? 0,
  };
  const total = p.totalReactions ?? Object.values(counts).reduce((a, b) => a + b, 0);

  const rawMedia = p.media || (p as any).mediaUrls || [];
  const mediaList = rawMedia.map((url, i) => ({
    id: `m-${p.id}-${i}`,
    url,
    type: 'image' as const,
  }));

  const authorData = p.author || {
    id: String((p as any).authorId || '1'),
    name: (p as any).authorName || 'Trader',
    username: (p as any).authorUsername || 'trader',
    avatarUrl: (p as any).authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
  };

  return {
    id: String(p.id),
    author: {
      id: String(authorData.id),
      name: authorData.name || 'Trader',
      avatarUrl: authorData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
      badge: (authorData as any).badge || (p as any).authorBadge || 'TRADER',
    },
    content: p.content,
    media: mediaList,
    privacy: (p.privacy?.toLowerCase() as any) || 'public',
    reactions: {
      counts,
      myReaction: (p.userReaction?.toLowerCase() as ReactionType) || null,
      total,
    },
    commentCount: p.commentCount ?? (p as any).commentsCount ?? 0,
    shareCount: p.shareCount ?? (p as any).sharesCount ?? 0,
    createdAt: p.createdAt ? String(p.createdAt) : new Date().toISOString(),
    groupId: p.groupId ? String(p.groupId) : undefined,
  };
}

function mapBackendIdea(dto: TradingIdeaDto): TradingIdea {
  return {
    id: String(dto.id),
    title: dto.title,
    symbol: dto.symbol,
    assetClass: (dto.assetClass as any) || 'crypto',
    timeframe: dto.timeframe || '1D',
    direction: dto.direction || 'long',
    coverImage: dto.coverImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format',
    videoDuration: dto.videoDuration,
    summary: dto.summary || '',
    content: dto.content || dto.summary || '',
    author: {
      id: String(dto.author?.id || '1'),
      name: dto.author?.name || 'Trader',
      username: dto.author?.username || 'trader',
      avatarUrl: dto.author?.avatarUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&auto=format',
      badge: dto.author?.badge || 'TRADER',
      reputation: dto.author?.reputation || 0,
      followersCount: dto.author?.followersCount || 0,
    },
    likes: dto.likes || 0,
    comments: [],
    boosts: dto.boosts || 0,
    views: dto.views || 0,
    tags: dto.tags || [],
    isEditorsPick: dto.isEditorsPick || false,
    createdAt: dto.createdAt || new Date().toISOString(),
    entryPrice: dto.entryPrice,
    targetPrice: dto.targetPrice,
    stopLossPrice: dto.stopLossPrice,
    backtestRunId: dto.backtestRunId,
  };
}

export function UserProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isMe = !userId || userId === String(user?.id);

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [coverUrl, setCoverUrl] = useState(COVER_PRESETS[0]);
  const [timelineTab, setTimelineTab] = useState<TimelineTab>('all');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [likedIdeaIds, setLikedIdeaIds] = useState<Set<string>>(new Set());

  // User posts & ideas (Only items published by this user)
  const [userIdeas, setUserIdeas] = useState<TradingIdea[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Friendship state (when viewing other users)
  const [friendshipStatus, setFriendshipStatus] = useState<'not_friend' | 'pending_sent' | 'pending_received' | 'friends'>('not_friend');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friendshipLoading, setFriendshipLoading] = useState(false);

  // Follow state & real counts
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Load profile and user's items from API
  useEffect(() => {
    let mounted = true;
    const targetId = isMe ? (user?.id ? String(user.id) : null) : userId;

    // Reset old user's profile and data
    setProfile(null);
    setUserPosts([]);
    setUserIdeas([]);
    setFriendshipStatus('not_friend');
    setFriendshipId(null);
    setIsFollowing(false);
    setFollowersCount(0);
    setFollowingCount(0);

    if (isMe) {
      communityApi
        .getMyProfile()
        .then((res) => {
          if (mounted && res) {
            setProfile(res);
            setFollowersCount(res.followersCount ?? 0);
            setFollowingCount(res.followingCount ?? 0);
          }
        })
        .catch(() => {});
    } else if (userId) {
      communityApi
        .getProfileById(userId)
        .then((res) => {
          if (mounted && res) {
            setProfile(res);
            setIsFollowing(Boolean(res.isFollowing));
            setFollowersCount(res.followersCount ?? 0);
            setFollowingCount(res.followingCount ?? 0);
          }
        })
        .catch(() => {});

      communityApi
        .getFriendshipStatus(userId)
        .then((res) => {
          if (mounted && res) {
            setFriendshipStatus(res.status);
            if (res.id) setFriendshipId(String(res.id));
          }
        })
        .catch(() => {});
    }

    if (targetId) {
      setLoadingItems(true);
      Promise.all([
        communityApi.getUserPosts(targetId, 0, 50).catch(() => null),
        communityApi.getUserIdeas(targetId, 0, 50).catch(() => null),
      ]).then(([postsRes, ideasRes]) => {
        if (!mounted) return;
        if (postsRes?.content) {
          setUserPosts(postsRes.content.map(mapBackendPost));
        } else {
          setUserPosts([]);
        }

        if (ideasRes?.content) {
          setUserIdeas(ideasRes.content.map(mapBackendIdea));
        } else {
          setUserIdeas([]);
        }
        setLoadingItems(false);
      });
    } else {
      setUserPosts([]);
      setUserIdeas([]);
    }

    return () => {
      mounted = false;
    };
  }, [userId, isMe, user?.id]);

  const handleSendFriendRequest = async () => {
    if (!userId || friendshipLoading) return;
    setFriendshipLoading(true);
    try {
      const res = await communityApi.sendFriendRequest(userId);
      setFriendshipStatus('pending_sent');
      if (res?.id) setFriendshipId(String(res.id));
    } catch (err) {
      console.error('Send friend request error:', err);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!userId || friendshipLoading) return;
    setFriendshipLoading(true);
    try {
      await communityApi.cancelFriendRequest(userId);
      setFriendshipStatus('not_friend');
      setFriendshipId(null);
    } catch (err) {
      console.error('Cancel friend request error:', err);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendshipId || friendshipLoading) return;
    setFriendshipLoading(true);
    try {
      await communityApi.respondFriendRequest(friendshipId, true);
      setFriendshipStatus('friends');
    } catch (err) {
      console.error('Accept friend request error:', err);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleUnfriend = async () => {
    if (!userId || friendshipLoading) return;
    setFriendshipLoading(true);
    try {
      await communityApi.removeFriend(userId);
      setFriendshipStatus('not_friend');
      setFriendshipId(null);
    } catch (err) {
      console.error('Unfriend error:', err);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!userId || isMe || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await communityApi.unfollowUser(userId);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await communityApi.followUser(userId);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Toggle follow failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const displayName =
    (profile as any)?.name ||
    profile?.displayName ||
    (isMe ? (user?.name || 'Trader') : `Trader #${userId}`);

  const displayAvatar =
    profile?.avatarUrl ||
    (isMe ? user?.avatarUrl : undefined) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'trader'}`;

  const displayBio =
    profile?.bio ||
    (isMe
      ? 'Chưa cập nhật tiểu sử phong cách giao dịch.'
      : 'Trader này chưa chia sẻ thêm thông tin giới thiệu bản thân.');
  const displayBadge = profile?.badge || 'TRADER';

  // Merge and sort only this user's published items chronologically (descending date)
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    userIdeas.forEach((idea) => {
      items.push({
        id: `idea-${idea.id}`,
        type: 'idea',
        date: idea.createdAt,
        dateHeader: formatDateHeader(idea.createdAt),
        ideaData: idea,
      });
    });

    userPosts.forEach((post) => {
      items.push({
        id: `post-${post.id}`,
        type: 'post',
        date: post.createdAt,
        dateHeader: formatDateHeader(post.createdAt),
        postData: post,
      });
    });

    // Sort newest first
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [userIdeas, userPosts]);

  // Filter items by active tab
  const filteredTimeline = useMemo(() => {
    if (timelineTab === 'ideas') return timelineItems.filter((i) => i.type === 'idea');
    if (timelineTab === 'posts') return timelineItems.filter((i) => i.type === 'post');
    return timelineItems;
  }, [timelineItems, timelineTab]);

  // Group items by dateHeader
  const groupedTimeline = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    filteredTimeline.forEach((item) => {
      const header = item.dateHeader;
      if (!map.has(header)) map.set(header, []);
      map.get(header)!.push(item);
    });
    return Array.from(map.entries());
  }, [filteredTimeline]);

  const handleDeletePost = async (postId: string) => {
    const numId = Number(postId);
    if (!isNaN(numId)) {
      try {
        await communityApi.deletePost(numId);
      } catch (err) {
        console.warn('Delete post API error:', err);
      }
    }
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleDeleteIdea = async (ideaId: string) => {
    const numId = Number(ideaId);
    if (!isNaN(numId)) {
      try {
        await communityApi.deleteIdea(numId);
      } catch (err) {
        console.warn('Delete idea API error:', err);
      }
    }
    setUserIdeas((prev) => prev.filter((i) => i.id !== ideaId));
  };

  const handleReactPost = (postId: string, type: ReactionType) => {
    const numId = Number(postId);
    if (!isNaN(numId)) {
      communityApi.reactPost(numId, type.toUpperCase() as any).catch(() => {});
    }
  };

  const handleLikeIdea = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const numId = Number(id);
    if (!isNaN(numId)) {
      communityApi.toggleLikeIdea(numId).catch(() => {});
    }
    setLikedIdeaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0f131a] text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      {/* Top Breadcrumb Header */}
      <div className="bg-white dark:bg-[#131722] border-b border-gray-200 dark:border-[#2a2e39] px-4 lg:px-8 py-3 sticky top-0 z-20 flex items-center justify-between">
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại Cộng đồng</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-900 dark:text-white">{displayName}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
            {displayBadge}
          </span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-4 space-y-6 flex-1">
        {/* =========================================================================
            1. HERO PROFILE CARD (Facebook / X Profile Style)
           ========================================================================= */}
        <div className="bg-white dark:bg-[#161b26] rounded-3xl border border-gray-200/90 dark:border-[#262c3a] shadow-xs overflow-hidden">
          {/* Cover Photo */}
          <div className="h-56 sm:h-72 w-full relative bg-gray-200 dark:bg-gray-800 overflow-hidden group">
            <img
              src={coverUrl}
              alt="Cover"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

            {/* Change Cover Button (if my profile) */}
            {isMe && (
              <button
                onClick={() => {
                  const nextIdx = (COVER_PRESETS.indexOf(coverUrl) + 1) % COVER_PRESETS.length;
                  setCoverUrl(COVER_PRESETS[nextIdx]);
                }}
                className="absolute bottom-4 right-4 px-3.5 py-2 rounded-xl backdrop-blur-md bg-black/60 hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Camera className="size-4" />
                <span>Đổi ảnh bìa</span>
              </button>
            )}
          </div>

          {/* Profile Header Bar */}
          <div className="px-6 sm:px-10 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              {/* Avatar & Main Titles */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                <div className="relative size-32 sm:size-36 rounded-full border-4 border-white dark:border-[#161b26] shadow-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  <img src={displayAvatar} alt={displayName} className="size-full object-cover" />
                  <div className="absolute bottom-2 right-2 size-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#161b26]" />
                </div>

                <div className="pt-2 sm:pt-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {displayName}
                    </h1>
                    <ShieldCheck className="size-6 text-blue-600 fill-blue-50 dark:fill-blue-950/40" />
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    @{(displayName).toLowerCase().replace(/\s+/g, '_')} ·{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{displayBadge}</span>
                  </p>

                  {/* Followers / Following Summary */}
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-300 mt-2">
                    <span>
                      <strong className="text-gray-900 dark:text-white font-bold">{followersCount.toLocaleString()}</strong> Người theo dõi
                    </span>
                    <span>·</span>
                    <span>
                      <strong className="text-gray-900 dark:text-white font-bold">{followingCount.toLocaleString()}</strong> Đang theo dõi
                    </span>
                    <span>·</span>
                    <span>
                      <strong className="text-gray-900 dark:text-white font-bold">{userIdeas.length}</strong> Ý tưởng
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
                {isMe ? (
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs border border-gray-200 dark:border-gray-700"
                  >
                    <Edit3 className="size-4" />
                    <span>Chỉnh sửa hồ sơ</span>
                  </button>
                ) : (
                  <>
                    {/* Follow / Unfollow Button */}
                    <button
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        isFollowing
                          ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="size-3.5 text-blue-500" />
                          <span>Đang theo dõi</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-3.5" />
                          <span>Theo dõi</span>
                        </>
                      )}
                    </button>

                    {/* Friend Relationship Action Buttons */}
                    {friendshipStatus === 'not_friend' && (
                      <button
                        onClick={handleSendFriendRequest}
                        disabled={friendshipLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <UserPlus className="size-4" />
                        <span>Thêm bạn bè</span>
                      </button>
                    )}

                    {friendshipStatus === 'pending_sent' && (
                      <button
                        onClick={handleCancelFriendRequest}
                        disabled={friendshipLoading}
                        className="px-4 py-2 bg-amber-50 hover:bg-red-50 text-amber-700 hover:text-red-600 dark:bg-amber-950/40 dark:hover:bg-red-950/40 dark:text-amber-300 dark:hover:text-red-400 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        title="Nhấn để hủy lời mời đã gửi"
                      >
                        <Clock className="size-4" />
                        <span>Đã gửi lời mời (Hủy)</span>
                      </button>
                    )}

                    {friendshipStatus === 'pending_received' && (
                      <button
                        onClick={handleAcceptFriendRequest}
                        disabled={friendshipLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="size-4" />
                        <span>Chấp nhận kết bạn</span>
                      </button>
                    )}

                    {friendshipStatus === 'friends' && (
                      <button
                        onClick={handleUnfriend}
                        disabled={friendshipLoading}
                        className="px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:hover:bg-red-950/30 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-gray-700 cursor-pointer flex items-center gap-1.5"
                        title="Nhấn để hủy kết bạn"
                      >
                        <Check className="size-4 text-emerald-500" />
                        <span>Bạn bè (Hủy)</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Profile Bio */}
            <p className="mt-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
              {displayBio}
            </p>
          </div>

          {/* Facebook-like Tabs Bar */}
          <div className="border-t border-gray-100 dark:border-[#262c3a] px-6 sm:px-10 flex items-center gap-2 sm:gap-6 overflow-x-auto">
            <button
              onClick={() => setTimelineTab('all')}
              className={`py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                timelineTab === 'all'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              Dòng thời gian ({timelineItems.length})
            </button>

            <button
              onClick={() => setTimelineTab('ideas')}
              className={`py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                timelineTab === 'ideas'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              Ý tưởng phân tích ({userIdeas.length})
            </button>

            <button
              onClick={() => setTimelineTab('posts')}
              className={`py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                timelineTab === 'posts'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              Bài viết thảo luận ({userPosts.length})
            </button>

            <button
              onClick={() => setTimelineTab('about')}
              className={`py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                timelineTab === 'about'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              Giới thiệu & Thống kê
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. BODY CONTENT (2-Column Facebook Timeline Layout)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (INTRO) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card: Giới thiệu (Intro) */}
            <div className="bg-white dark:bg-[#161b26] rounded-2xl p-5 border border-gray-200/90 dark:border-[#262c3a] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="size-4 text-blue-600" />
                <span>Giới thiệu</span>
              </h3>

              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-3">
                  <Briefcase className="size-4 text-gray-400 shrink-0" />
                  <span>
                    Chuyên gia phân tích kỹ thuật tại <strong>Quant Trading Hub</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-gray-400 shrink-0" />
                  <span>Sống tại <strong>TP. Hồ Chí Minh, Việt Nam</strong></span>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-gray-400 shrink-0" />
                  <span>Tham gia từ <strong>Tháng 1, 2024</strong></span>
                </div>

                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-gray-400 shrink-0" />
                  <span>Thị trường chính: <strong>Crypto, Forex, US Stocks</strong></span>
                </div>
              </div>

              {isMe && (
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Chỉnh sửa chi tiết
                </button>
              )}
            </div>
          </div>

          {/* CỘT PHẢI (DÒNG THỜI GIAN BÀI ĐĂNG SẮP XẾP THEO NGÀY) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Hướng dẫn đăng bài: Không cho đăng trực tiếp ở profile, chỉ đăng tại Social Feed và Trading Ideas */}
            {isMe && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-4 sm:p-5 border border-blue-200/70 dark:border-blue-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs">
                    <Clock className="size-4 shrink-0" />
                    <span>Lưu trữ hoạt động cá nhân</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Trang cá nhân tổng hợp các bài viết và phân tích của bạn. Để chia sẻ nội dung mới, hãy đăng tại Bảng tin Social hoặc Ý tưởng giao dịch.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate('/community/feed')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare className="size-3.5" />
                    <span>Bảng tin</span>
                  </button>
                  <button
                    onClick={() => navigate('/community')}
                    className="px-3.5 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <TrendingUp className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Ý tưởng</span>
                  </button>
                </div>
              </div>
            )}

            {/* Dòng thời gian hiển thị theo nhóm ngày (Timeline by Date) */}
            {timelineTab !== 'about' && (
              <div className="space-y-6">
                {groupedTimeline.length > 0 ? (
                  groupedTimeline.map(([dateGroup, items]) => (
                    <div key={dateGroup} className="space-y-4">
                      {/* Tiêu đề nhóm ngày */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-xs">
                          <Clock className="size-3.5" />
                          <span>{dateGroup}</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-200/80 dark:border-[#262c3a]" />
                      </div>

                      {/* Các bài đăng trong nhóm ngày */}
                      <div className="space-y-5">
                        {items.map((item) => {
                          if (item.type === 'idea' && item.ideaData) {
                            return (
                              <div key={item.id} className="space-y-1">
                                <div className="text-[11px] text-gray-400 px-1 font-medium flex items-center gap-1.5">
                                  <span>Ý tưởng giao dịch</span>
                                  <span>·</span>
                                  <span>{new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <IdeaCard
                                  idea={item.ideaData}
                                  onClick={(i) => navigate(`/community/ideas/${i.id}`)}
                                  onLike={handleLikeIdea}
                                  isLiked={likedIdeaIds.has(item.ideaData.id)}
                                  onDelete={isMe ? (id, e) => handleDeleteIdea(id) : undefined}
                                />
                              </div>
                            );
                          }

                          if (item.type === 'post' && item.postData) {
                            return (
                              <div key={item.id} className="space-y-1">
                                <div className="text-[11px] text-gray-400 px-1 font-medium flex items-center gap-1.5">
                                  <span>Bài viết thảo luận</span>
                                  <span>·</span>
                                  <span>{new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <PostCard
                                  post={item.postData}
                                  currentUserId={user?.id ? String(user.id) : 'u0'}
                                  currentUser={{ id: user?.id ? String(user.id) : 'u0', name: displayName, avatarUrl: displayAvatar }}
                                  onReact={handleReactPost}
                                  onDelete={isMe ? handleDeletePost : undefined}
                                />
                              </div>
                            );
                          }

                          return null;
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center bg-white dark:bg-[#161b26] rounded-2xl border border-gray-200 dark:border-[#262c3a] space-y-3">
                    <MessageSquare className="size-8 text-gray-400 mx-auto" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Chưa có bài đăng nào trong mục này.
                    </p>
                    <p className="text-xs text-gray-400">
                      Các bài viết tại Bảng tin Social và Ý tưởng giao dịch bạn đăng sẽ tự động xuất hiện ở đây.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Giới thiệu & Thống kê chi tiết */}
            {timelineTab === 'about' && (
              <div className="bg-white dark:bg-[#161b26] rounded-2xl p-6 border border-gray-200 dark:border-[#262c3a] shadow-xs space-y-6">
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Thông tin hồ sơ đầy đủ
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-1">Phương pháp giao dịch</h4>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Sử dụng hệ thống Price Action kết hợp các đường trung bình động động lượng (EMA 20, 50, 200). Đánh giá cấu trúc thị trường (Market Structure Break / Change of Character) và thanh khoản Liquidity Sweep để vào lệnh tỷ lệ R:R tối ưu.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-1">Quy tắc quản trị vốn</h4>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Tối đa 1 - 2% rủi ro tài khoản trên một vị thế. Luôn đặt Cắt lỗ (Stop Loss) trước khi vào lệnh. Dời Stop Loss về hòa vốn (Breakeven) khi giá đạt 1R.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-1">Cộng đồng & Mạng xã hội</h4>
                    <div className="flex gap-2 mt-2">
                      <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium">Telegram: @alex_quant</span>
                      <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium">Twitter / X: @alex_trader</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onProfileUpdated={(updated) => setProfile(updated)}
      />
    </div>
  );
}

export default UserProfilePage;
