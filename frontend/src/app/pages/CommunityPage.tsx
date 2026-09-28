import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { TradingIdea, MarketCategory, IdeaFilter, IdeaComment } from '../community/types';
import { initialTradingIdeas } from '../community/data/mockIdeas';
import { CategoryFilterBar } from '../community/components/CategoryFilterBar';
import { IdeaCard } from '../community/components/IdeaCard';
import { PublishIdeaModal } from '../community/components/PublishIdeaModal';
import { useAuth } from '../context/AuthContext';
import { Plus, Search } from 'lucide-react';

const VALID_CATEGORIES: MarketCategory[] = ['all', 'crypto', 'stocks', 'forex', 'indices', 'strategies'];

export function CommunityPage() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ideas, setIdeas] = useState<TradingIdea[]>(initialTradingIdeas);
  const [activeFilter, setActiveFilter] = useState<IdeaFilter>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedIdeaIds, setLikedIdeaIds] = useState<Set<string>>(new Set());
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // Normalize category from URL param
  const activeCategory: MarketCategory = useMemo(() => {
    if (!category) return 'all';
    const lower = category.toLowerCase() as MarketCategory;
    return VALID_CATEGORIES.includes(lower) ? lower : 'all';
  }, [category]);

  const handleCategoryChange = (cat: MarketCategory) => {
    if (cat === 'all') {
      navigate('/community');
    } else {
      navigate(`/community/${cat}`);
    }
  };

  const filteredIdeas = useMemo(() => {
    return ideas
      .filter((idea) => {
        // Filter tab (Popular, Editors' picks, Trending)
        if (activeFilter === 'editors_picks' && !idea.isEditorsPick) return false;

        // Category filter
        if (activeCategory !== 'all') {
          if (activeCategory === 'crypto' && idea.assetClass !== 'crypto') return false;
          if (activeCategory === 'stocks' && idea.assetClass !== 'stocks') return false;
          if (activeCategory === 'forex' && idea.assetClass !== 'forex') return false;
          if (activeCategory === 'indices' && idea.assetClass !== 'indices') return false;
          if (
            activeCategory === 'strategies' &&
            !idea.tags.some(
              (t) =>
                t.toLowerCase().includes('backtest') ||
                t.toLowerCase().includes('strategy') ||
                t.toLowerCase().includes('quant') ||
                t.toLowerCase().includes('cross') ||
                t.toLowerCase().includes('bot')
            )
          )
            return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = idea.title.toLowerCase().includes(q);
          const matchSymbol = idea.symbol.toLowerCase().includes(q);
          const matchAuthor = idea.author.name.toLowerCase().includes(q);
          const matchTag = idea.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchSymbol && !matchAuthor && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (activeFilter === 'popular') return b.likes - a.likes;
        if (activeFilter === 'trending') return b.views - a.views;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [ideas, activeFilter, activeCategory, searchQuery]);

  const handleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedIdeaIds((prev) => {
      const next = new Set(prev);
      const isAlreadyLiked = next.has(id);
      if (isAlreadyLiked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setIdeas((all) =>
        all.map((item) =>
          item.id === id
            ? { ...item, likes: isAlreadyLiked ? Math.max(0, item.likes - 1) : item.likes + 1 }
            : item
        )
      );
      return next;
    });
  };

  const handleBoost = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdeas((all) =>
      all.map((item) => (item.id === id ? { ...item, boosts: item.boosts + 1 } : item))
    );
  };

  const handlePublish = (newIdea: TradingIdea) => {
    setIdeas((prev) => [newIdea, ...prev]);
    navigate(`/community/ideas/${newIdea.id}`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#131722] text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 w-full flex-1">
        {/* Category & Filter Navigation */}
        <CategoryFilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Ideas Grid Section */}
        <div className="py-6">
          {filteredIdeas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={(i) => navigate(`/community/ideas/${i.id}`)}
                  onLike={handleLike}
                  onBoost={handleBoost}
                  isLiked={likedIdeaIds.has(idea.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-gray-50 dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-3xl p-8 space-y-4 max-w-xl mx-auto my-8">
              <div className="size-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl">
                <Search className="size-8" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Không tìm thấy ý tưởng phù hợp
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục thị trường khác.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('all');
                  setActiveFilter('popular');
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button on mobile */}
      <button
        onClick={() => setIsPublishOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden size-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl hover:bg-blue-700 transition-transform active:scale-95 z-30 cursor-pointer"
        aria-label="Publish new idea"
      >
        <Plus className="size-6" />
      </button>

      {/* Modals */}
      <PublishIdeaModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        onPublish={handlePublish}
      />
    </div>
  );
}
export default CommunityPage;
