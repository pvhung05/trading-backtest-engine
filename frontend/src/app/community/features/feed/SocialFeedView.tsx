import { useState, useEffect } from 'react';
import type { Post, ReactionType, User } from '../../types';
import { mockPosts, currentUser as defaultUser } from '../../data/mock';
import Composer from '../composer/Composer';
import PostCard from './PostCard';
import { communityApi, type PostResponse } from '../../../services';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare } from 'lucide-react';

function mapBackendPost(p: PostResponse, currentUserId?: string): Post {
  const counts: Record<ReactionType, number> = {
    like: p.reactionsCount?.['LIKE'] || 0,
    love: p.reactionsCount?.['LOVE'] || 0,
    haha: p.reactionsCount?.['HAHA'] || 0,
    wow: p.reactionsCount?.['WOW'] || 0,
    sad: p.reactionsCount?.['SAD'] || 0,
    angry: p.reactionsCount?.['ANGRY'] || 0,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const mediaList = (p.mediaUrls || []).map((url, i) => ({
    id: `m-${p.id}-${i}`,
    url,
    type: 'image' as const,
  }));

  const myReaction = p.userReaction
    ? (p.userReaction.toLowerCase() as ReactionType)
    : null;

  return {
    id: String(p.id),
    author: {
      id: String(p.authorId),
      name: p.authorName || 'Trader',
      avatarUrl: p.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
      badge: p.authorBadge || 'TRADER',
    },
    content: p.content,
    media: mediaList,
    privacy: (p.privacy?.toLowerCase() as any) || 'public',
    reactions: {
      counts,
      myReaction,
      total,
    },
    commentCount: p.commentsCount || 0,
    shareCount: p.sharesCount || 0,
    createdAt: p.createdAt || new Date().toISOString(),
    groupId: p.groupId ? String(p.groupId) : undefined,
  };
}

export function SocialFeedView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(false);

  const appCurrentUser: User = {
    id: user?.id ? String(user.id) : defaultUser.id,
    name: user?.name || defaultUser.name,
    avatarUrl: user?.avatarUrl || defaultUser.avatarUrl,
    email: user?.email,
    isOnline: true,
  };

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await communityApi.getPosts({ page: 0, size: 20 });
      if (res?.content && res.content.length > 0) {
        const livePosts = res.content.map((p) => mapBackendPost(p, String(user?.id)));
        const liveIds = new Set(livePosts.map((p) => p.id));
        const filteredMock = mockPosts.filter((p) => !liveIds.has(p.id));
        setPosts([...livePosts, ...filteredMock]);
      }
    } catch (err) {
      console.warn('Could not load posts from community-service, using fallback mock data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handlePost = async (content: string, privacy: 'public' | 'friends' | 'private') => {
    let createdPostId = `p-${Date.now()}`;
    try {
      const created = await communityApi.createPost({
        content,
        privacy: privacy.toUpperCase() as any,
      });
      if (created?.id) {
        createdPostId = String(created.id);
      }
    } catch (err) {
      console.warn('Failed to post to backend API, created locally in session:', err);
    }

    const newPost: Post = {
      id: createdPostId,
      author: appCurrentUser,
      content,
      media: [],
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
  };

  const handleReact = async (postId: string, type: ReactionType) => {
    const numId = Number(postId);
    if (!isNaN(numId)) {
      try {
        await communityApi.reactPost(numId, type.toUpperCase() as any);
      } catch (err) {
        console.warn('Reaction API error:', err);
      }
    }
  };

  const displayedPosts = [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Post Composer */}
      <Composer onPost={handlePost} currentUser={appCurrentUser} />

      {/* Post Stream */}
      <div className="space-y-4">
        {displayedPosts.length > 0 ? (
          displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={appCurrentUser.id}
              currentUser={appCurrentUser}
              onReact={handleReact}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#1e222d] rounded-2xl border border-gray-200 dark:border-[#2a2e39] p-6 space-y-3">
            <MessageSquare className="size-8 text-gray-400 mx-auto" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Chưa có bài viết thảo luận nào. Hãy là người đầu tiên chia sẻ góc nhìn!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialFeedView;
