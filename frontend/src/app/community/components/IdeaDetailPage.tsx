import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Rocket,
  Share2,
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Eye,
  Calendar,
  Tag,
  Bookmark,
  Check,
  Compass,
} from 'lucide-react';
import type { TradingIdea, IdeaComment } from '../types';
import { useAuth } from '../../context/AuthContext';
import { UserMenu } from '../../components/toolbar/UserMenu';

interface IdeaDetailPageProps {
  idea: TradingIdea;
  onBack: () => void;
  onSelectRelatedIdea?: (idea: TradingIdea) => void;
  allIdeas?: TradingIdea[];
  onLike?: (id: string) => void;
  onBoost?: (id: string) => void;
  onAddComment?: (ideaId: string, text: string) => void;
  isLiked?: boolean;
}

export function IdeaDetailPage({
  idea,
  onBack,
  onSelectRelatedIdea,
  allIdeas = [],
  onLike,
  onBoost,
  onAddComment,
  isLiked = false,
}: IdeaDetailPageProps) {
  const { user, logout } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scroll to top when loaded or idea changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idea.id]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment?.(idea.id, commentText.trim());
    setCommentText('');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDirectionBadge = () => {
    switch (idea.direction) {
      case 'long':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="size-4" />
            Long / Bullish
          </span>
        );
      case 'short':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <TrendingDown className="size-4" />
            Short / Bearish
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-500/15 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30">
            <Minus className="size-4" />
            Neutral / Range
          </span>
        );
    }
  };

  // Filter related ideas
  const relatedIdeas = allIdeas
    .filter((i) => i.id !== idea.id && (i.assetClass === idea.assetClass || i.symbol === idea.symbol))
    .slice(0, 3);

  return (
    <div className="min-h-full bg-[#f8fafc] dark:bg-[#131722] text-gray-900 dark:text-gray-100 font-sans pb-16">
      {/* Top Primary Header Bar - Replaces global header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#131722]/95 backdrop-blur-md border-b border-gray-200/80 dark:border-[#2a2e39] select-none shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Left: Back button & Breadcrumb */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 truncate">
              <span className="text-gray-400">/</span>
              <span className="capitalize font-semibold text-gray-700 dark:text-gray-300">{idea.assetClass}</span>
              <span className="text-gray-400">/</span>
              <span className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-xs md:max-w-md lg:max-w-lg">
                {idea.title}
              </span>
            </div>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-[#1e222d] dark:hover:bg-[#2a2e39] border-transparent text-gray-600 dark:text-gray-400'
              }`}
              title="Lưu tin tức"
            >
              <Bookmark className={`size-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#1e222d] dark:hover:bg-[#2a2e39] text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              {copied ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
              <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Chia sẻ'}</span>
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-[#2a2e39] mx-1 hidden sm:block" />

            {/* User Profile */}
            <UserMenu
              userName={user?.name || 'Trader Alex'}
              onLogout={logout}
              onOpenCommunity={onBack}
            />
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-8 space-y-8">
        {/* Article Header & Meta */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-600 text-white font-mono shadow-xs">
              {idea.symbol}
            </span>
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-200 dark:bg-[#2a2e39] text-gray-800 dark:text-gray-200">
              Khung: {idea.timeframe}
            </span>
            {getDirectionBadge()}
            {idea.isEditorsPick && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <CheckCircle className="size-3.5" />
                Lựa chọn của biên tập viên
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
            {idea.title}
          </h1>

          {/* Author Card & Date Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-gray-200/80 dark:border-[#2a2e39] pb-6">
            <div className="flex items-center gap-3">
              {idea.author.avatarUrl ? (
                <img
                  src={idea.author.avatarUrl}
                  alt={idea.author.name}
                  className="size-12 rounded-full object-cover ring-2 ring-blue-500/30"
                />
              ) : (
                <div className="size-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {idea.author.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{idea.author.name}</span>
                  {idea.author.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {idea.author.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  <span>@{idea.author.username}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {new Date(idea.createdAt).toLocaleDateString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {idea.views.toLocaleString()} lượt xem
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isFollowing
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi tác giả'}
            </button>
          </div>
        </div>

        {/* Feature Visual Hero / Chart Image */}
        <div className="relative rounded-3xl overflow-hidden bg-[#0d1117] border border-gray-200/80 dark:border-[#2a2e39] shadow-xl">
          <img
            src={idea.coverImage}
            alt={idea.title}
            className="w-full h-auto max-h-[620px] object-contain mx-auto"
          />
        </div>

        {/* Price Targets Grid Widget */}
        {(idea.entryPrice || idea.targetPrice || idea.stopLossPrice) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] shadow-xs">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#131722]/80 border border-gray-200/50 dark:border-[#2a2e39]/50 text-center">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Điểm Vào Lệnh (Entry)</div>
              <div className="text-lg font-black font-mono text-gray-900 dark:text-white mt-1">
                {idea.entryPrice || '—'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-center">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Mục Tiêu Chốt Lời (Take Profit)</div>
              <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {idea.targetPrice || '—'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 text-center">
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">Điểm Cắt Lỗ (Stop Loss)</div>
              <div className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                {idea.stopLossPrice || '—'}
              </div>
            </div>
          </div>
        )}

        {/* Article Body + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article Content (Left) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-[#2a2e39] pb-3">
                Phân Tích Chi Tiết & Nhận Định Kỹ Thuật
              </h2>

              {/* Summary lead paragraph */}
              <p className="text-base text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-blue-600 p-4 rounded-r-xl">
                {idea.summary}
              </p>

              {/* Full Content */}
              <div className="text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line space-y-4">
                {idea.content}
              </div>

              {/* Tags */}
              {idea.tags.length > 0 && (
                <div className="pt-4 border-t border-gray-100 dark:border-[#2a2e39]">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="size-3.5" />
                    Chủ đề & Thẻ liên quan
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {idea.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#131722] text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-[#2a2e39]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Reaction Bar */}
              <div className="pt-6 border-t border-gray-100 dark:border-[#2a2e39] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onLike?.(idea.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      isLiked
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-600'
                        : 'bg-white dark:bg-[#131722] border-gray-200 dark:border-[#2a2e39] text-gray-700 dark:text-gray-300 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`size-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{idea.likes} Thích</span>
                  </button>

                  <button
                    onClick={() => onBoost?.(idea.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    <Rocket className="size-4 text-amber-500" />
                    <span>{idea.boosts} Đẩy tin (Boost)</span>
                  </button>
                </div>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-[#131722] dark:hover:bg-[#2a2e39] text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  <Share2 className="size-4" />
                  <span>Chia sẻ bài viết</span>
                </button>
              </div>
            </div>

            {/* Comments & Discussion Section */}
            <div className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Thảo Luận & Bình Luận ({idea.comments.length})
              </h3>

              {/* Comment Input */}
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div className="flex gap-3">
                  <div className="size-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Viết nhận định, câu hỏi hoặc góc nhìn của bạn về bài viết này..."
                    className="flex-1 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="size-3.5" />
                    <span>Gửi bình luận</span>
                  </button>
                </div>
              </form>

              {/* Comment List */}
              <div className="space-y-4 pt-2">
                {idea.comments.length > 0 ? (
                  idea.comments.map((c: IdeaComment) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#131722]/80 border border-gray-100 dark:border-[#2a2e39] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                            {c.author.name}
                          </span>
                          {c.author.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                              {c.author.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic py-4 text-center">
                    Chưa có bình luận nào. Hãy là người đầu tiên đóng góp góc nhìn!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Author details & Quick Stats */}
          <div className="space-y-6">
            {/* Author Profile Box */}
            <div className="bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-3xl p-6 space-y-5 shadow-xs">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông Tin Tác Giả</h4>

              <div className="flex items-center gap-3.5">
                {idea.author.avatarUrl ? (
                  <img
                    src={idea.author.avatarUrl}
                    alt={idea.author.name}
                    className="size-14 rounded-full object-cover ring-2 ring-blue-500/20"
                  />
                ) : (
                  <div className="size-14 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center">
                    {idea.author.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate">{idea.author.name}</h5>
                  <p className="text-xs text-gray-400">@{idea.author.username}</p>
                  {idea.author.badge && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      {idea.author.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200/50 dark:border-[#2a2e39] text-center">
                <div>
                  <div className="text-[11px] text-gray-400">Điểm Uy Tín</div>
                  <div className="font-black text-sm text-gray-900 dark:text-white font-mono mt-0.5">
                    {idea.author.reputation?.toLocaleString() || '1,500'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">Người Theo Dõi</div>
                  <div className="font-black text-sm text-gray-900 dark:text-white font-mono mt-0.5">
                    {idea.author.followersCount?.toLocaleString() || '450'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFollowing(!isFollowing)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isFollowing
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                {isFollowing ? '✓ Đang theo dõi' : '+ Theo dõi tác giả'}
              </button>
            </div>

            {/* Quick Disclaimer */}
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-3xl p-5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <Compass className="size-4 text-amber-600" />
                Miễn trừ trách nhiệm:
              </div>
              <p>
                Mọi thông tin và phân tích trong bài viết mang tính chất tham khảo học thuật từ cộng đồng, không phải là lời khuyên đầu tư tài chính trực tiếp.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Related Ideas & News */}
        {relatedIdeas.length > 0 && (
          <div className="pt-8 border-t border-gray-200/80 dark:border-[#2a2e39] space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tin Tức & Ý Tưởng Cùng Thị Trường
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedIdeas.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelatedIdea?.(rel)}
                  className="group bg-white dark:bg-[#1e222d] border border-gray-200/80 dark:border-[#2a2e39] rounded-2xl overflow-hidden hover:border-blue-500/60 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-gray-900 relative">
                    <img
                      src={rel.coverImage}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white font-mono">
                      {rel.symbol}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {rel.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100 dark:border-[#2a2e39]">
                      <span>{rel.author.name}</span>
                      <span className="flex items-center gap-1">
                        <Heart className="size-3" />
                        {rel.likes}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
