import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { TradingIdea, TradeDirection } from '../types';
import { useAuth } from '../../context/AuthContext';
import { mockAuthors } from '../data/mockIdeas';

interface PublishIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (newIdea: TradingIdea) => void;
}

const PRESET_CHARTS = [
  { label: 'Technical Chart 1', url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format' },
  { label: 'Technical Chart 2', url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&h=450&fit=crop&auto=format' },
  { label: 'Technical Chart 3', url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&h=450&fit=crop&auto=format' },
  { label: 'Technical Chart 4', url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800&h=450&fit=crop&auto=format' },
];

export function PublishIdeaModal({ isOpen, onClose, onPublish }: PublishIdeaModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [symbol, setSymbol] = useState('BINANCE:BTCUSDT');
  const [assetClass, setAssetClass] = useState<'crypto' | 'stocks' | 'forex' | 'indices'>('crypto');
  const [timeframe, setTimeframe] = useState('1D');
  const [direction, setDirection] = useState<TradeDirection>('long');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_CHARTS[0].url);
  const [tags, setTags] = useState('Bitcoin, PriceAction, Breakout');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const newIdea: TradingIdea = {
      id: `idea-${Date.now()}`,
      title: title.trim(),
      symbol: symbol.toUpperCase(),
      assetClass,
      timeframe,
      direction,
      coverImage,
      summary: summary.trim(),
      content: content.trim() || summary.trim(),
      author: {
        id: user?.id ? String(user.id) : 'u0',
        name: user?.name || 'Trader Alex',
        username: (user?.name || 'alex_trader').toLowerCase().replace(/\s+/g, '_'),
        avatarUrl: mockAuthors.alex.avatarUrl,
        badge: 'TRADER',
        reputation: 1200,
        followersCount: 350,
      },
      likes: 1,
      boosts: 0,
      views: 1,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      isEditorsPick: false,
      createdAt: new Date().toISOString(),
      entryPrice: entryPrice.trim() || undefined,
      targetPrice: targetPrice.trim() || undefined,
      stopLossPrice: stopLossPrice.trim() || undefined,
      comments: [],
    };

    onPublish(newIdea);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#1e222d]/95 backdrop-blur-md p-5 border-b border-gray-100 dark:border-[#2a2e39] flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">
              Publish New Trading Idea
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Idea Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. $BTC: 66k Resistance Breakout & Next Bullish Wave Analysis..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white font-medium outline-none focus:border-blue-500"
            />
          </div>

          {/* Symbol & Timeframe & Asset Class */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Symbol *
              </label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. BINANCE:BTCUSDT"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white font-mono text-xs font-semibold outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Asset Class
              </label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white text-xs font-medium outline-none focus:border-blue-500"
              >
                <option value="crypto">Crypto</option>
                <option value="stocks">Stocks</option>
                <option value="forex">Forex</option>
                <option value="indices">Indices</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white text-xs font-medium outline-none focus:border-blue-500"
              >
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="4h">4h</option>
                <option value="1D">1D (Daily)</option>
                <option value="1W">1W (Weekly)</option>
              </select>
            </div>
          </div>

          {/* Direction Sentiment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2">
              Forecast Direction (Sentiment)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDirection('long')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                  direction === 'long'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-[#131722] text-gray-600 dark:text-gray-400 border border-transparent hover:border-emerald-500/50'
                }`}
              >
                <TrendingUp className="size-4" />
                Long / Buy
              </button>

              <button
                type="button"
                onClick={() => setDirection('short')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                  direction === 'short'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-[#131722] text-gray-600 dark:text-gray-400 border border-transparent hover:border-rose-500/50'
                }`}
              >
                <TrendingDown className="size-4" />
                Short / Sell
              </button>

              <button
                type="button"
                onClick={() => setDirection('neutral')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                  direction === 'neutral'
                    ? 'bg-gray-700 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-[#131722] text-gray-600 dark:text-gray-400 border border-transparent hover:border-gray-500/50'
                }`}
              >
                <Minus className="size-4" />
                Neutral
              </button>
            </div>
          </div>

          {/* Entry, TP, SL Targets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Entry Price
              </label>
              <input
                type="text"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="e.g. 64,500"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white font-mono text-xs outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                Target Price (TP)
              </label>
              <input
                type="text"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g. 72,000"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                Stop Loss (SL)
              </label>
              <input
                type="text"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                placeholder="e.g. 62,800"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white font-mono text-xs outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Brief Summary *
            </label>
            <textarea
              rows={2}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="1-2 sentences summarizing the core idea..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Full Content */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Detailed Technical Breakdown
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detail indicators (SMA, RSI, MACD, Volume Profile, wave structure...)"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Select Chart Image Preset */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <ImageIcon className="size-4" />
              Select Chart Thumbnail
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_CHARTS.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setCoverImage(p.url)}
                  className={`aspect-[16/9] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    coverImage === p.url ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Bitcoin, RSI, EMA-Cross, Breakout"
              className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#2a2e39] text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 dark:border-[#2a2e39] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Publish Idea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
