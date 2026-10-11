import { useState, useMemo, useEffect } from 'react';
import type { TradingIdea, MarketCategory, IdeaFilter, IdeaComment } from './types';
import { initialTradingIdeas } from './data/mockIdeas';
import { TradingViewNavbar } from './components/TradingViewNavbar';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { IdeaCard } from './components/IdeaCard';
import { PublishIdeaModal } from './components/PublishIdeaModal';
import { IdeaDetailPage } from './components/IdeaDetailPage';
import { useAuth } from '../context/AuthContext';
import { communityApi, type TradingIdeaDto } from '../services';

interface CommunityPageProps {
  onBackToTrading?: () => void;
  hideHeader?: boolean;
  onDetailOpenChange?: (open: boolean) => void;
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

export default function CommunityPage({
  onBackToTrading,
  hideHeader = false,
  onDetailOpenChange,
}: CommunityPageProps) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<TradingIdea[]>(initialTradingIdeas);
  const [activeFilter, setActiveFilter] = useState<IdeaFilter>('popular');
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedIdeaIds, setLikedIdeaIds] = useState<Set<string>>(new Set());

  const [selectedIdea, setSelectedIdeaState] = useState<TradingIdea | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  const setSelectedIdea = (idea: TradingIdea | null) => {
    setSelectedIdeaState(idea);
    onDetailOpenChange?.(!!idea);
  };

  useEffect(() => {
    communityApi
      .getIdeas({ page: 0, size: 24 })
      .then((res) => {
        if (res?.content && res.content.length > 0) {
          const liveIdeas = res.content.map(mapBackendIdea);
          setIdeas(liveIdeas);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch ideas from backend, using default list:', err);
      });
  }, []);

  // Filter & Search logic
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      // Filter tab (Popular, Editors' picks, Trending)
      if (activeFilter === 'editors_picks' && !idea.isEditorsPick) return false;

      // Category filter
      if (activeCategory !== 'all') {
        if (activeCategory === 'crypto' && idea.assetClass !== 'crypto') return false;
        if (activeCategory === 'stocks' && idea.assetClass !== 'stocks') return false;
        if (activeCategory === 'forex' && idea.assetClass !== 'forex') return false;
        if (activeCategory === 'indices' && idea.assetClass !== 'indices') return false;
        if (activeCategory === 'strategies' && !idea.tags.some((t) => t.toLowerCase().includes('backtest') || t.toLowerCase().includes('strategy') || t.toLowerCase().includes('quant') || t.toLowerCase().includes('cross') || t.toLowerCase().includes('bot'))) return false;
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
    }).sort((a, b) => {
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
      if (selectedIdea?.id === id) {
        setSelectedIdea((curr) =>
          curr ? { ...curr, likes: isAlreadyLiked ? Math.max(0, curr.likes - 1) : curr.likes + 1 } : null
        );
      }
      return next;
    });

    const numId = Number(id);
    if (!isNaN(numId)) {
      communityApi.toggleLikeIdea(numId).catch((err) => console.warn('Idea like API error:', err));
    }
  };

  const handleBoost = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIdeas((all) =>
      all.map((item) => (item.id === id ? { ...item, boosts: item.boosts + 1 } : item))
    );
    if (selectedIdea?.id === id) {
      setSelectedIdea((curr) => (curr ? { ...curr, boosts: curr.boosts + 1 } : null));
    }
    const numId = Number(id);
    if (!isNaN(numId)) {
      communityApi.boostIdea(numId).catch((err) => console.warn('Idea boost API error:', err));
    }
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

    if (selectedIdea?.id === ideaId) {
      setSelectedIdea((curr) =>
        curr ? { ...curr, comments: [newComment, ...curr.comments] } : null
      );
    }

    const numId = Number(ideaId);
    if (!isNaN(numId)) {
      communityApi.addIdeaComment(numId, text).catch((err) => console.warn('Idea comment API error:', err));
    }
  };

  const handlePublish = async (newIdea: TradingIdea) => {
    let finalIdea = newIdea;
    try {
      const created = await communityApi.createIdea({
        title: newIdea.title,
        symbol: newIdea.symbol,
        assetClass: newIdea.assetClass,
        timeframe: newIdea.timeframe,
        direction: newIdea.direction,
        entryPrice: newIdea.entryPrice ? Number(newIdea.entryPrice) : undefined,
        targetPrice: newIdea.targetPrice ? Number(newIdea.targetPrice) : undefined,
        stopLossPrice: newIdea.stopLossPrice ? Number(newIdea.stopLossPrice) : undefined,
        summary: newIdea.summary,
        content: newIdea.content,
        coverImage: newIdea.coverImage,
        tags: newIdea.tags,
      });
      if (created?.id) {
        finalIdea = mapBackendIdea(created);
      }
    } catch (err) {
      console.warn('Could not publish idea to backend, saved locally:', err);
    }

    setIdeas((prev) => [finalIdea, ...prev.filter((it) => it.id !== finalIdea.id)]);
    setSelectedIdea(finalIdea);
  };

  return (
    <div className="min-h-full bg-[#ffffff] dark:bg-[#131722] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
      {/* TradingView Top Navbar */}
      {!hideHeader && (
        <TradingViewNavbar
          activeNav="community"
          onNavChange={(nav) => {
            if (nav === 'products') onBackToTrading?.();
          }}
          onPublishClick={() => setIsPublishOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {/* Main Container: Render Detail Page or Grid List */}
      {selectedIdea ? (
        <IdeaDetailPage
          idea={selectedIdea}
          onBack={() => setSelectedIdea(null)}
          onSelectRelatedIdea={(rel) => setSelectedIdea(rel)}
          allIdeas={ideas}
          onLike={handleLike}
          onBoost={handleBoost}
          onAddComment={handleAddComment}
          isLiked={likedIdeaIds.has(selectedIdea.id)}
        />
      ) : (
        <main className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 w-full flex-1">
          {/* Category & Filter Navigation */}
          <CategoryFilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Ideas Grid Section */}
          <div className="py-6">
            {filteredIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onClick={(i) => setSelectedIdea(i)}
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
                  No matching ideas found
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Try searching with different keywords or switch categories to explore more community ideas.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                    setActiveFilter('popular');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </main>
      )}

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

