import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initialTradingIdeas } from '../community/data/mockIdeas';
import type { TradingIdea, IdeaComment } from '../community/types';
import { IdeaDetailPage as IdeaDetailView } from '../community/components/IdeaDetailPage';
import { useAuth } from '../context/AuthContext';
import { communityApi, type TradingIdeaResponse, type IdeaCommentResponse } from '../services';
import { ArrowLeft, Search } from 'lucide-react';

function mapBackendIdeaToTradingIdea(item: TradingIdeaResponse): TradingIdea {
  return {
    id: String(item.id),
    title: item.title,
    symbol: item.symbol,
    assetClass: (item.assetClass?.toLowerCase() as any) || 'crypto',
    timeframe: item.timeframe || '1D',
    direction: (item.direction?.toLowerCase() as any) || 'neutral',
    coverImage: item.coverImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format',
    summary: item.summary || '',
    content: item.content || item.summary || '',
    author: {
      id: String(item.authorId || '0'),
      name: item.authorName || 'Trader',
      username: item.authorUsername || 'trader',
      avatarUrl: item.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      badge: (item.authorBadge as any) || 'TRADER',
      reputation: 1000,
      followersCount: 100,
    },
    likes: item.likesCount || 0,
    boosts: item.boostsCount || 0,
    commentsCount: item.commentsCount || 0,
    views: item.viewsCount || 0,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt,
    entryPrice: item.entryPrice,
    targetPrice: item.targetPrice,
    stopLossPrice: item.stopLossPrice,
    tags: item.tags || [],
    isEditorsPick: item.isEditorsPick || false,
    comments: [],
  };
}

function mapBackendComment(c: IdeaCommentResponse): IdeaComment {
  return {
    id: String(c.id),
    author: {
      id: String(c.userId),
      name: c.userName || 'Trader',
      username: (c.userName || 'trader').toLowerCase().replace(/\s+/g, '_'),
      avatarUrl: c.userAvatar,
      badge: (c.userBadge as any) || 'TRADER',
    },
    content: c.content,
    createdAt: c.createdAt || new Date().toISOString(),
    likes: c.likesCount || 0,
  };
}

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ideas, setIdeas] = useState<TradingIdea[]>(initialTradingIdeas);
  const [likedIdeaIds, setLikedIdeaIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const numId = Number(id);
    if (!isNaN(numId)) {
      communityApi
        .getIdeaById(numId)
        .then(async (ideaRes) => {
          if (ideaRes) {
            const mapped = mapBackendIdeaToTradingIdea(ideaRes);
            try {
              const commentsRes = await communityApi.getIdeaComments(numId);
              if (commentsRes?.content) {
                mapped.comments = commentsRes.content.map(mapBackendComment);
              }
            } catch (err) {
              console.warn('Could not load idea comments:', err);
            }
            setIdeas((prev) => {
              const existingIdx = prev.findIndex((i) => i.id === String(ideaRes.id));
              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = mapped;
                return next;
              }
              return [mapped, ...prev];
            });
            if (ideaRes.hasLiked) {
              setLikedIdeaIds((prev) => new Set(prev).add(String(ideaRes.id)));
            }
          }
        })
        .catch((err) => {
          console.warn('Could not load idea from backend API, relying on mock ideas:', err);
        });
    }
  }, [id]);

  const currentIdea = useMemo(() => {
    return ideas.find((i) => i.id === id) || null;
  }, [ideas, id]);

  const handleLike = (ideaId: string) => {
    const numId = Number(ideaId);
    if (!isNaN(numId) && user) {
      communityApi.toggleIdeaLike(numId).catch((err) => console.warn('Toggle like error:', err));
    }
    setLikedIdeaIds((prev) => {
      const next = new Set(prev);
      const isAlreadyLiked = next.has(ideaId);
      if (isAlreadyLiked) next.delete(ideaId);
      else next.add(ideaId);

      setIdeas((all) =>
        all.map((item) =>
          item.id === ideaId
            ? { ...item, likes: isAlreadyLiked ? Math.max(0, item.likes - 1) : item.likes + 1 }
            : item
        )
      );
      return next;
    });
  };

  const handleBoost = (ideaId: string) => {
    const numId = Number(ideaId);
    if (!isNaN(numId) && user) {
      communityApi.toggleIdeaBoost(numId).catch((err) => console.warn('Toggle boost error:', err));
    }
    setIdeas((all) =>
      all.map((item) => (item.id === ideaId ? { ...item, boosts: item.boosts + 1 } : item))
    );
  };

  const handleAddComment = async (ideaId: string, text: string) => {
    let commentId = `c-${Date.now()}`;
    const numId = Number(ideaId);
    if (!isNaN(numId) && user) {
      try {
        const created = await communityApi.addIdeaComment(numId, text);
        if (created?.id) commentId = String(created.id);
      } catch (err) {
        console.warn('Error saving comment to backend:', err);
      }
    }

    const newComment: IdeaComment = {
      id: commentId,
      author: {
        id: user?.id ? String(user.id) : 'u0',
        name: user?.name || 'Nguyễn Minh Tuấn',
        username: (user?.name || 'tuan').toLowerCase().replace(/\s+/g, '_'),
        badge: 'TRADER',
      },
      content: text,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setIdeas((all) =>
      all.map((item) =>
        item.id === ideaId
          ? {
              ...item,
              commentsCount: item.commentsCount + 1,
              comments: [newComment, ...(item.comments || [])],
            }
          : item
      )
    );
  };

  if (!currentIdea) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 bg-white dark:bg-[#131722] text-gray-900 dark:text-gray-100">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl bg-gray-50 dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39]">
          <div className="size-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto text-2xl">
            <Search className="size-8" />
          </div>
          <h2 className="text-xl font-bold">Không tìm thấy bài viết</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Ý tưởng hoặc tin tức giao dịch này có thể đã bị xóa hoặc đường dẫn không chính xác.
          </p>
          <button
            onClick={() => navigate('/community')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại trang Cộng đồng</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <IdeaDetailView
        idea={currentIdea}
        onBack={() => navigate('/community')}
        onSelectRelatedIdea={(rel) => navigate(`/community/ideas/${rel.id}`)}
        allIdeas={ideas}
        onLike={handleLike}
        onBoost={handleBoost}
        onAddComment={handleAddComment}
        isLiked={likedIdeaIds.has(currentIdea.id)}
      />
    </div>
  );
}
export default IdeaDetailPage;
