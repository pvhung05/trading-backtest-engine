import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initialTradingIdeas } from '../community/data/mockIdeas';
import type { TradingIdea, IdeaComment } from '../community/types';
import { IdeaDetailPage as IdeaDetailView } from '../community/components/IdeaDetailPage';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Search } from 'lucide-react';

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ideas, setIdeas] = useState<TradingIdea[]>(initialTradingIdeas);
  const [likedIdeaIds, setLikedIdeaIds] = useState<Set<string>>(new Set());

  const currentIdea = useMemo(() => {
    return ideas.find((i) => i.id === id) || null;
  }, [ideas, id]);

  const handleLike = (ideaId: string) => {
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
    setIdeas((all) =>
      all.map((item) => (item.id === ideaId ? { ...item, boosts: item.boosts + 1 } : item))
    );
  };

  const handleAddComment = (ideaId: string, text: string) => {
    const newComment: IdeaComment = {
      id: `c-${Date.now()}`,
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
        item.id === ideaId ? { ...item, comments: [newComment, ...item.comments] } : item
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
