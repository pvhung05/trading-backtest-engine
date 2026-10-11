import { useState, useEffect } from 'react';
import type { Post, ReactionType, User } from '../../types';
import { mockPosts, currentUser as defaultUser } from '../../data/mock';
import { useNavigate } from 'react-router-dom';
import Composer from '../composer/Composer';
import PostCard from './PostCard';
import { communityApi, type PostResponse } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, Globe, Users, UserPlus } from 'lucide-react';

function mapBackendPost(p: PostResponse, currentUserId?: string): Post {
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

  const myReaction = p.userReaction
    ? (p.userReaction.toLowerCase() as ReactionType)
    : null;

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
      myReaction,
      total,
    },
    commentCount: p.commentCount ?? (p as any).commentsCount ?? 0,
    shareCount: p.shareCount ?? (p as any).sharesCount ?? 0,
    createdAt: p.createdAt ? String(p.createdAt) : new Date().toISOString(),
    groupId: p.groupId ? String(p.groupId) : undefined,
  };
}

export function SocialFeedView() {
  const { user } = useAuth();
  const [feedTab, setFeedTab] = useState<'all' | 'friends'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const appCurrentUser: User = {
    id: user?.id ? String(user.id) : defaultUser.id,
    name: user?.name || defaultUser.name,
    avatarUrl: user?.avatarUrl || defaultUser.avatarUrl,
    email: user?.email,
    isOnline: true,
  };

  const loadFeed = async (tab: 'all' | 'friends') => {
    setLoading(true);
    try {
      const res =
        tab === 'friends'
          ? await communityApi.getFriendsFeed(0, 30)
          : await communityApi.getPosts({ page: 0, size: 30 });

      if (res?.content) {
        const livePosts = res.content.map((p) => mapBackendPost(p, String(user?.id)));
        setPosts(livePosts);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.warn('Could not load posts from community-service:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(feedTab);
  }, [feedTab]);

  const handleDeletePost = async (postId: string) => {
    const numId = Number(postId);
    if (!isNaN(numId)) {
      try {
        await communityApi.deletePost(numId);
      } catch (err) {
        console.warn('Delete post failed:', err);
      }
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePost = async (
    content: string,
    privacy: 'public' | 'friends' | 'private',
    mediaUrls?: string[]
  ) => {
    let createdPostId = `p-${Date.now()}`;
    let backendPost: PostResponse | null = null;
    try {
      const created = await communityApi.createPost({
        content,
        media: mediaUrls && mediaUrls.length > 0 ? mediaUrls : undefined,
        privacy: privacy.toUpperCase() as any,
      });
      if (created?.id) {
        createdPostId = String(created.id);
        backendPost = created;
      }
    } catch (err) {
      console.warn('Failed to post to backend API, created locally in session:', err);
    }

    if (backendPost) {
      const mapped = mapBackendPost(backendPost, String(user?.id));
      setPosts((prev) => [mapped, ...prev.filter((p) => p.id !== mapped.id)]);
    } else {
      const newPost: Post = {
        id: createdPostId,
        author: appCurrentUser,
        content,
        media: (mediaUrls || []).map((url, i) => ({
          id: `m-${i}-${Date.now()}`,
          url,
          type: 'image',
        })),
        privacy,
        reactions: {
          counts: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
          myReaction: null,
          total: 0,
        },
        commentCount: 0,
        shareCount: 0,
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) => [newPost, ...prev]);
    }
  };

  const handleReact = async (postId: string, type: ReactionType) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const prevReaction = p.reactions.myReaction;
        const newReaction = prevReaction === type ? null : type;
        const newCounts = { ...p.reactions.counts };

        if (prevReaction) {
          newCounts[prevReaction] = Math.max(0, (newCounts[prevReaction] || 1) - 1);
        }
        if (newReaction) {
          newCounts[newReaction] = (newCounts[newReaction] || 0) + 1;
        }

        const newTotal = Object.values(newCounts).reduce((a, b) => a + b, 0);
        return {
          ...p,
          reactions: {
            counts: newCounts,
            myReaction: newReaction,
            total: newTotal,
          },
        };
      })
    );

    const numId = Number(postId);
    if (!isNaN(numId)) {
      try {
        await communityApi.reactPost(numId, type.toUpperCase() as any);
      } catch (err) {
        console.warn('Reaction API error:', err);
      }
    }
  };

  const navigate = useNavigate();
  const displayedPosts = [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Post Composer */}
      <Composer onPost={handlePost} currentUser={appCurrentUser} />

      {/* Feed Tabs Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2a2e39] pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              feedTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Globe className="size-4" />
            <span>Khám phá ({feedTab === 'all' ? posts.length : 'Tất cả'})</span>
          </button>

          <button
            onClick={() => setFeedTab('friends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              feedTab === 'friends'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="size-4" />
            <span>Tin bạn bè ({feedTab === 'friends' ? posts.length : 'Bạn bè'})</span>
          </button>
        </div>

        <button
          onClick={() => navigate('/community/friends')}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="size-3.5" />
          <span>Kết nối bạn bè</span>
        </button>
      </div>

      {/* Post Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white dark:bg-[#1e222d] rounded-2xl border border-gray-200 dark:border-[#2a2e39] p-6 space-y-2">
            <div className="size-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500">Đang tải bảng tin...</p>
          </div>
        ) : displayedPosts.length > 0 ? (
          displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={appCurrentUser.id}
              currentUser={appCurrentUser}
              onReact={handleReact}
              onDelete={handleDeletePost}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#1e222d] rounded-2xl border border-gray-200 dark:border-[#2a2e39] p-6 space-y-3">
            <MessageSquare className="size-8 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {feedTab === 'friends'
                ? 'Bạn bè của bạn chưa đăng bài viết nào gần đây.'
                : 'Chưa có bài viết thảo luận nào. Hãy là người đầu tiên chia sẻ góc nhìn!'}
            </p>
            {feedTab === 'friends' ? (
              <div className="pt-2">
                <button
                  onClick={() => navigate('/community/friends')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <UserPlus className="size-4" />
                  <span>Tìm kiếm & Kết bạn ngay</span>
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialFeedView;
