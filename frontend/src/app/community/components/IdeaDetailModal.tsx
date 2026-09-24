import { useState } from 'react';
import { X, Heart, Rocket, Share2, Send, TrendingUp, TrendingDown, Minus, ShieldCheck, CheckCircle } from 'lucide-react';
import type { TradingIdea, IdeaComment } from '../types';
import { useAuth } from '../../context/AuthContext';

interface IdeaDetailModalProps {
  idea: TradingIdea | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (id: string) => void;
  onBoost?: (id: string) => void;
  onAddComment?: (ideaId: string, text: string) => void;
  isLiked?: boolean;
}

export function IdeaDetailModal({
  idea,
  isOpen,
  onClose,
  onLike,
  onBoost,
  onAddComment,
  isLiked,
}: IdeaDetailModalProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  if (!isOpen || !idea) return null;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment?.(idea.id, commentText.trim());
    setCommentText('');
  };

  const getDirectionBadge = () => {
    switch (idea.direction) {
      case 'long':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
            <TrendingUp className="size-4" />
            Long / Buy
          </span>
        );
      case 'short':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
            <TrendingDown className="size-4" />
            Short / Sell
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-600 text-white shadow-xs">
            <Minus className="size-4" />
            Neutral
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-gray-200/80 dark:border-[#2a2e39] flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#1e222d]/80 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-3 py-1 rounded-lg text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 font-mono">
              {idea.symbol}
            </span>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {idea.timeframe}
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            {getDirectionBadge()}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Idea Headline */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {idea.title}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Published on {new Date(idea.createdAt).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Full Chart Image */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-200/60 dark:border-[#2a2e39] shadow-inner">
            <img
              src={idea.coverImage}
              alt={idea.title}
              className="w-full object-contain max-h-[500px]"
            />
          </div>

          {/* Targets Summary (Entry, TP, SL) */}
          {(idea.entryPrice || idea.targetPrice || idea.stopLossPrice) && (
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200/60 dark:border-[#2a2e39] text-center">
              <div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Entry Price</div>
                <div className="text-base font-black font-mono text-gray-900 dark:text-white mt-0.5">{idea.entryPrice || '—'}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Target Price (TP)</div>
                <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{idea.targetPrice || '—'}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Stop Loss (SL)</div>
                <div className="text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">{idea.stopLossPrice || '—'}</div>
              </div>
            </div>
          )}

          {/* 2-Column Content: Analysis Text (Left) & Author Info (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analysis Text */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-white border-b border-gray-100 dark:border-[#2a2e39] pb-2">
                Technical Analysis Breakdown
              </h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line space-y-3">
                {idea.content}
              </div>

              {/* Tags */}
              {idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {idea.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-[#131722] text-gray-600 dark:text-gray-400 border border-gray-200/50 dark:border-[#2a2e39]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Author Sidebar */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200/60 dark:border-[#2a2e39] space-y-4">
                <div className="flex items-center gap-3">
                  {idea.author.avatarUrl ? (
                    <img src={idea.author.avatarUrl} alt="" className="size-12 rounded-full object-cover" />
                  ) : (
                    <div className="size-12 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center">
                      {idea.author.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{idea.author.name}</h4>
                    <p className="text-xs text-gray-400">@{idea.author.username}</p>
                    {idea.author.badge && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        {idea.author.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 dark:border-[#2a2e39] text-center text-xs">
                  <div>
                    <div className="text-gray-400">Reputation</div>
                    <div className="font-bold text-gray-900 dark:text-white mt-0.5 font-mono">{idea.author.reputation?.toLocaleString() || 1200}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Followers</div>
                    <div className="font-bold text-gray-900 dark:text-white mt-0.5 font-mono">{idea.author.followersCount?.toLocaleString() || 450}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isFollowing
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {isFollowing ? '✓ Following' : '+ Follow Author'}
                </button>
              </div>
            </div>
          </div>

          {/* Social Interactions Bar */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200/60 dark:border-[#2a2e39] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onLike?.(idea.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isLiked
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600'
                    : 'bg-white dark:bg-[#1e222d] border-gray-200 dark:border-[#2a2e39] text-gray-700 dark:text-gray-300 hover:text-rose-600'
                }`}
              >
                <Heart className={`size-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{idea.likes} Likes</span>
              </button>

              <button
                onClick={() => onBoost?.(idea.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] text-gray-700 dark:text-gray-300 hover:text-amber-500 transition-colors cursor-pointer"
              >
                <Rocket className="size-4 text-amber-500" />
                <span>{idea.boosts} Boost</span>
              </button>
            </div>

            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-[#1e222d] transition-colors cursor-pointer"
            >
              <Share2 className="size-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Discussion ({idea.comments.length})
            </h3>

            {/* Post comment input */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment or critique on this idea..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-xs text-gray-900 dark:text-white outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="size-3.5" />
                <span>Send</span>
              </button>
            </form>

            {/* Comment List */}
            <div className="space-y-3 pt-2">
              {idea.comments.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-100 dark:border-[#2a2e39] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">{c.author.name}</span>
                      {c.author.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                          {c.author.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
