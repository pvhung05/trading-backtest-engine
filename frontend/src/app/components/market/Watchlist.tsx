import { useEffect, useState, useMemo, useRef } from 'react';
import { Search, RefreshCw, Radio } from 'lucide-react';
import { marketApi, MarketTickerResponse } from '../../services/marketApi';
import { websocketService, RealtimeTicker } from '../../services/websocketService';
import { useOHLCV } from '../../context/OHLCVContext';

type WatchlistTier = 'full' | 'compact' | 'mini';

export function Watchlist() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<WatchlistTier>('full');
  const { symbol: selectedSymbol, setSymbol } = useOHLCV();
  const [tickers, setTickers] = useState<MarketTickerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWsConnected, setIsWsConnected] = useState(websocketService.getConnectedStatus());

  // Responsive tier detection on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number | null = null;
    const ro = new ResizeObserver((entries) => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        for (const entry of entries) {
          const w = entry.contentRect.width;
          if (w >= 270) {
            setTier('full');
          } else if (w >= 195) {
            setTier('compact');
          } else {
            setTier('mini');
          }
        }
      });
    });

    ro.observe(el);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const data = await marketApi.getWatchlist(30);
      if (Array.isArray(data) && data.length > 0) {
        setTickers(data);
      }
    } catch (err) {
      console.warn('Failed to load watchlist from API Gateway:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();

    const unsubStatus = websocketService.onConnectionChange((connected) => {
      setIsWsConnected(connected);
    });

    const unsubWs = websocketService.subscribeWatchlist((update) => {
      if (!update) return;

      const items: RealtimeTicker[] = Array.isArray(update) ? update : [update];

      setTickers((prev) => {
        const next = [...prev];
        items.forEach((item) => {
          if (!item.symbol) return;
          const idx = next.findIndex(
            (t) => t.symbol.toUpperCase() === item.symbol.toUpperCase()
          );
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              lastPrice: String(item.lastPrice ?? next[idx].lastPrice),
              priceChange: String(item.priceChange ?? next[idx].priceChange),
              priceChangePercent: String(
                item.priceChangePercent ?? next[idx].priceChangePercent
              ),
              highPrice: String(item.highPrice ?? next[idx].highPrice),
              lowPrice: String(item.lowPrice ?? next[idx].lowPrice),
              volume: String(item.volume ?? next[idx].volume),
              updateTime: item.updateTime || Date.now(),
            };
          } else {
            next.push({
              symbol: item.symbol,
              lastPrice: String(item.lastPrice || '0'),
              priceChange: String(item.priceChange || '0'),
              priceChangePercent: String(item.priceChangePercent || '0'),
              highPrice: String(item.highPrice || '0'),
              lowPrice: String(item.lowPrice || '0'),
              volume: String(item.volume || '0'),
              quoteVolume: String(item.quoteVolume || '0'),
              updateTime: item.updateTime || Date.now(),
            });
          }
        });
        return next;
      });
    });

    return () => {
      unsubStatus();
      unsubWs();
    };
  }, []);

  const filteredTickers = useMemo(() => {
    if (!searchQuery.trim()) return tickers;
    const q = searchQuery.toUpperCase().trim();
    return tickers.filter((t) => t.symbol.toUpperCase().includes(q));
  }, [tickers, searchQuery]);

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden text-gray-900 dark:text-gray-100 select-none"
    >
      {/* Header */}
      <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate">Watchlist</span>
          {tier !== 'mini' && (
            <span
              className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                isWsConnected
                  ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
              }`}
              title={isWsConnected ? 'Live WebSocket Connected' : 'Connecting to Live WebSocket…'}
            >
              <Radio className={`size-2.5 ${isWsConnected ? 'animate-pulse' : ''}`} />
              {isWsConnected ? 'LIVE' : 'SYNCING'}
            </span>
          )}
        </div>
        <button
          onClick={fetchWatchlist}
          disabled={loading}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-all cursor-pointer shrink-0"
          title="Refresh Watchlist"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-2.5 py-1.5 border-b border-gray-200/80 dark:border-gray-700/80 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={tier === 'mini' ? 'Search...' : 'Search coin (e.g. BTC)...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Column Headers */}
      <div className="px-2.5 py-1.5 border-b border-gray-200/80 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
        {tier === 'full' && (
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-400">
            <div className="truncate">Symbol</div>
            <div className="text-right truncate">Last</div>
            <div className="text-right truncate">Chg</div>
            <div className="text-right truncate">Chg%</div>
          </div>
        )}
        {tier === 'compact' && (
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-400">
            <div className="truncate">Symbol</div>
            <div className="text-right truncate">Last</div>
            <div className="text-right truncate">Chg%</div>
          </div>
        )}
        {tier === 'mini' && (
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-400">
            <div className="truncate">Symbol</div>
            <div className="text-right truncate">Last</div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && tickers.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            Loading market tickers...
          </div>
        ) : filteredTickers.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400">
            No symbols found.
          </div>
        ) : (
          filteredTickers.map((item) => (
            <WatchlistRow
              key={item.symbol}
              item={item}
              tier={tier}
              isSelected={
                selectedSymbol.toUpperCase().replace('/', '') ===
                item.symbol.toUpperCase().replace('/', '')
              }
              onSelect={() => setSymbol(item.symbol)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WatchlistRow({
  item,
  tier = 'full',
  isSelected = false,
  onSelect,
}: {
  item: MarketTickerResponse;
  tier?: WatchlistTier;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const price = parseFloat(item.lastPrice || '0');
  const change = parseFloat(item.priceChange || '0');
  const changePercent = parseFloat(item.priceChangePercent || '0');
  const isPositive = change >= 0;

  const formattedPrice =
    price >= 10
      ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });

  return (
    <div
      onClick={onSelect}
      className={`mx-1 my-0.5 px-2 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium shadow-2xs border border-blue-200/60 dark:border-blue-800/40'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-800 dark:text-gray-200'
      }`}
    >
      {tier === 'full' && (
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] gap-1.5 items-center">
          <div className="font-semibold truncate min-w-0" title={item.symbol}>
            {item.symbol}
          </div>
          <div className="text-right tabular-nums truncate min-w-0" title={formattedPrice}>
            {formattedPrice}
          </div>
          <div
            className={`text-right tabular-nums font-medium truncate min-w-0 ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {Math.abs(change) >= 10 ? change.toFixed(2) : change.toFixed(4)}
          </div>
          <div
            className={`text-right tabular-nums font-medium truncate min-w-0 ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%
          </div>
        </div>
      )}

      {tier === 'compact' && (
        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-1.5 items-center">
          <div className="font-semibold truncate min-w-0" title={item.symbol}>
            {item.symbol}
          </div>
          <div className="text-right tabular-nums truncate min-w-0" title={formattedPrice}>
            {formattedPrice}
          </div>
          <div
            className={`text-right tabular-nums font-medium truncate min-w-0 ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%
          </div>
        </div>
      )}

      {tier === 'mini' && (
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-1.5 items-center">
          <div className="font-semibold truncate min-w-0" title={item.symbol}>
            {item.symbol}
          </div>
          <div
            className={`text-right tabular-nums font-semibold truncate min-w-0 ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
            title={formattedPrice}
          >
            {formattedPrice}
          </div>
        </div>
      )}
    </div>
  );
}
