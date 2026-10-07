import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { TradingIdea, MarketCategory, IdeaFilter } from '../community/types';
import { initialTradingIdeas } from '../community/data/mockIdeas';
import { CategoryFilterBar } from '../community/components/CategoryFilterBar';
import { IdeaCard } from '../community/components/IdeaCard';
import { PublishIdeaModal } from '../community/components/PublishIdeaModal';
import { ProfileEditModal } from '../community/components/ProfileEditModal';
import { SocialFeedView } from '../community/features/feed/SocialFeedView';
import { GroupsView } from '../community/features/groups/GroupsView';
import { FriendsView } from '../community/features/friend/FriendsView';
import { useAuth } from '../context/AuthContext';
import { communityApi, type TradingIdeaResponse, type UserProfileResponse } from '../services';
import {
  Lightbulb,
  MessageSquare,
  Users,
  UserCheck,
  Plus,
  Search,
  Award,
  Sparkles,
} from 'lucide-react';

const VALID_CATEGORIES: MarketCategory[] = ['all', 'crypto', 'stocks', 'forex', 'indices', 'strategies'];

type MainTab = 'ideas' | 'feed' | 'groups' | 'friends';

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

export function CommunityPage() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mainTab, setMainTab] = useState<MainTab>('ideas');
  const [ideas, setIdeas] = useState<TradingIdea[]>(initialTradingIdeas);
  const [activeFilter, setActiveFilter] = useState<IdeaFilter>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedIdeaIds, setLikedIdeaIds] = useState<Set<string>>(new Set());
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [myProfile, setMyProfile] = useState<UserProfileResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    communityApi
      .getIdeas({ page: 0, size: 20 })
      .then((res) => {
        if (mounted && res?.content && res.content.length > 0) {
          const liveIdeas = res.content.map(mapBackendIdeaToTradingIdea);
          setIdeas((prev) => {
            const liveIds = new Set(liveIdeas.map((i) => i.id));
            const filteredPrev = prev.filter((i) => !liveIds.has(i.id));
            return [...liveIdeas, ...filteredPrev];
          });
        }
      })
      .catch((err) => {
        console.warn('Backend community service not reachable or empty, using demo ideas', err);
      });

    communityApi
      .getMyProfile()
      .then((profile) => {
        if (mounted && profile) {
          setMyProfile(profile);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

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
        if (activeFilter === 'editors_picks' && !idea.isEditorsPick) return false;

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
    const numId = Number(id);
    if (!isNaN(numId) && user) {
      communityApi.toggleIdeaLike(numId).catch((err) => console.warn('Idea like API error:', err));
    }
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
    const numId = Number(id);
    if (!isNaN(numId) && user) {
      communityApi.toggleIdeaBoost(numId).catch((err) => console.warn('Idea boost API error:', err));
    }
    setIdeas((all) =>
      all.map((item) => (item.id === id ? { ...item, boosts: item.boosts + 1 } : item))
    );
  };

  const handlePublish = async (newIdea: TradingIdea) => {
    try {
      const created = await communityApi.createIdea({
        title: newIdea.title,
        symbol: newIdea.symbol,
        assetClass: newIdea.assetClass,
        timeframe: newIdea.timeframe,
        direction: newIdea.direction,
        coverImage: newIdea.coverImage,
        summary: newIdea.summary,
        content: newIdea.content,
        entryPrice: newIdea.entryPrice ? Number(newIdea.entryPrice) : undefined,
        targetPrice: newIdea.targetPrice ? Number(newIdea.targetPrice) : undefined,
        stopLossPrice: newIdea.stopLossPrice ? Number(newIdea.stopLossPrice) : undefined,
        tags: newIdea.tags,
      });
      if (created?.id) {
        newIdea.id = String(created.id);
      }
    } catch (err) {
      console.warn('Could not persist idea to community-service, kept in memory:', err);
    }
    setIdeas((prev) => [newIdea, ...prev]);
    navigate(`/community/ideas/${newIdea.id}`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#131722] text-gray-900 dark:text-gray-100 flex flex-col font-sans relative">
      {/* 4 Circular Navigation Buttons Arranged Vertically on the Left Edge */}
      <aside
        className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3 p-2 bg-white/90 dark:bg-[#1e222d]/90 backdrop-blur-xl border border-gray-200/80 dark:border-[#2a2e39] rounded-full shadow-2xl"
        aria-label="Community navigation"
      >
        {(
          [
            { id: 'ideas', label: 'Trading Ideas', icon: Lightbulb },
            { id: 'feed', label: 'Social Feed', icon: MessageSquare },
            { id: 'groups', label: 'Trading Groups', icon: Users },
            { id: 'friends', label: 'Friends & Network', icon: UserCheck },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = mainTab === tab.id;
          return (
            <div key={tab.id} className="relative group flex items-center">
              <button
                onClick={() => setMainTab(tab.id)}
                className={`size-11 sm:size-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:scale-105'
                }`}
                aria-label={tab.label}
              >
                <Icon className="size-5" />
              </button>

              {/* Hover Name in English (Tooltips to the right) */}
              <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gray-900/95 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold whitespace-nowrap shadow-xl opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 flex items-center">
                <span>{tab.label}</span>
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95 dark:border-r-gray-100" />
              </div>
            </div>
          );
        })}

        {/* Action: Publish Idea (When in ideas tab) */}
        {mainTab === 'ideas' && (
          <div className="relative group flex items-center">
            <button
              onClick={() => setIsPublishOpen(true)}
              className="size-11 sm:size-12 rounded-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Publish Idea"
            >
              <Plus className="size-5" />
            </button>
            <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gray-900/95 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold whitespace-nowrap shadow-xl opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 flex items-center">
              <span>Publish Idea</span>
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95 dark:border-r-gray-100" />
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="w-6 h-px bg-gray-200 dark:bg-gray-700/80 mx-auto my-0.5" />

        {/* Action: Profile Button */}
        <div className="relative group flex items-center">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="size-11 sm:size-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden p-0.5 border-2 border-transparent hover:border-blue-500 hover:scale-105"
            aria-label="Community Profile"
          >
            <img
              src={
                myProfile?.avatarUrl ||
                user?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'
              }
              alt="Profile"
              className="size-full rounded-full object-cover"
            />
          </button>
          <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gray-900/95 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold whitespace-nowrap shadow-xl opacity-0 pointer-events-none -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 flex items-center">
            <span>Community Profile</span>
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900/95 dark:border-r-gray-100" />
          </div>
        </div>
      </aside>

      {/* Main Container Content */}
      <main className="max-w-[1440px] mx-auto px-4 pl-20 sm:pl-24 lg:pl-24 lg:px-8 py-6 w-full flex-1">
        {/* Tab 1: Trading Ideas */}
        {mainTab === 'ideas' && (
          <div className="space-y-6">
            <CategoryFilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />

            <div className="py-2">
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
          </div>
        )}

        {/* Tab 2: Social Discussion Feed */}
        {mainTab === 'feed' && <SocialFeedView />}

        {/* Tab 3: Trading Groups */}
        {mainTab === 'groups' && <GroupsView />}

        {/* Tab 4: Friends & Network */}
        {mainTab === 'friends' && <FriendsView />}
      </main>

      {/* Floating Action Button on mobile */}
      {mainTab === 'ideas' && (
        <button
          onClick={() => setIsPublishOpen(true)}
          className="fixed bottom-6 right-6 lg:hidden size-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl hover:bg-blue-700 transition-transform active:scale-95 z-30 cursor-pointer"
          aria-label="Publish new idea"
        >
          <Plus className="size-6" />
        </button>
      )}

      {/* Modals */}
      <PublishIdeaModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        onPublish={handlePublish}
      />

      <ProfileEditModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={(updated) => setMyProfile(updated)}
      />
    </div>
  );
}

export default CommunityPage;
