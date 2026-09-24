import type { TradingIdea } from '../types';
import { Heart, MessageSquare, Rocket, Play, TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';

interface IdeaCardProps {
  idea: TradingIdea;
  onClick?: (idea: TradingIdea) => void;
  onLike?: (id: string, e: React.MouseEvent) => void;
  onBoost?: (id: string, e: React.MouseEvent) => void;
  isLiked?: boolean;
}

export function IdeaCard({ idea, onClick, onLike, onBoost, isLiked }: IdeaCardProps) {
  const getDirectionBadge = () => {
    switch (idea.direction) {
      case 'long':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/90 text-white shadow-xs backdrop-blur-xs">
            <TrendingUp className="size-3.5" />
            Long
          </span>
        );
      case 'short':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/90 text-white shadow-xs backdrop-blur-xs">
            <TrendingDown className="size-3.5" />
            Short
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-600/90 text-white shadow-xs backdrop-blur-xs">
            <Minus className="size-3.5" />
            Neutral
          </span>
        );
    }
  };

  const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <article
      onClick={() => onClick?.(idea)}
      className="group bg-white dark:bg-[#1e222d] border border-gray-200/90 dark:border-[#2a2e39] rounded-2xl overflow-hidden shadow-2xs hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Chart Thumbnail Area */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-900 select-none">
        <img
          src={idea.coverImage}
          alt={idea.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40 pointer-events-none" />

        {/* Top-left: Ticker badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-black/70 text-white backdrop-blur-md border border-white/10 shadow-xs">
            {idea.symbol}
          </span>
          <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/20 text-white backdrop-blur-md">
            {idea.timeframe}
          </span>
        </div>

        {/* Top-right: Editors' Pick Badge */}
        {idea.isEditorsPick && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/90 text-white shadow-xs backdrop-blur-xs">
              <CheckCircle className="size-3" />
              Editors' Pick
            </span>
          </div>
        )}

        {/* Video Play Button Overlay if Video */}
        {idea.videoDuration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-12 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-200">
              <Play className="size-5 fill-current ml-0.5" />
            </div>
          </div>
        )}

        {/* Bottom Bar on Image */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            {getDirectionBadge()}
          </div>
          {idea.videoDuration && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-black/80 text-white backdrop-blur-xs">
              {idea.videoDuration}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            {idea.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
            {idea.summary}
          </p>
        </div>

        {/* Price targets preview if available */}
        {(idea.entryPrice || idea.targetPrice) && (
          <div className="flex items-center gap-3 pt-1 text-[11px] font-medium border-t border-gray-100 dark:border-[#2a2e39]/80 text-gray-600 dark:text-gray-300">
            {idea.entryPrice && (
              <span>Entry: <strong className="text-gray-900 dark:text-white font-mono">{idea.entryPrice}</strong></span>
            )}
            {idea.targetPrice && (
              <span>TP: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{idea.targetPrice}</strong></span>
            )}
            {idea.stopLossPrice && (
              <span>SL: <strong className="text-rose-600 dark:text-rose-400 font-mono">{idea.stopLossPrice}</strong></span>
            )}
          </div>
        )}

        {/* Author & Stats Footer */}
        <div className="pt-2 border-t border-gray-100 dark:border-[#2a2e39] flex items-center justify-between">
          {/* Author */}
          <div className="flex items-center gap-2 min-w-0">
            {idea.author.avatarUrl ? (
              <img
                src={idea.author.avatarUrl}
                alt={idea.author.name}
                className="size-6.5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="size-6.5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {idea.author.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex items-center gap-1.5 truncate">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {idea.author.name}
              </span>
              {idea.author.badge && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shrink-0">
                  {idea.author.badge}
                </span>
              )}
            </div>
          </div>

          {/* Social Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 shrink-0 select-none">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(idea.id, e);
              }}
              className={`flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ${
                isLiked ? 'text-rose-600 font-bold' : ''
              }`}
            >
              <Heart className={`size-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{idea.likes}</span>
            </button>

            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              <span>{idea.comments.length}</span>
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onBoost?.(idea.id, e);
              }}
              className="flex items-center gap-1 hover:text-amber-500 transition-colors"
              title="Boost idea"
            >
              <Rocket className="size-3.5 text-amber-500" />
              <span>{idea.boosts}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
