import { useEffect, useRef, useState } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';

type TabKey = 'indicators' | 'strategies' | 'my-scripts';

interface Indicator {
  name: string;
  badge?: 'NEW' | 'BETA';
}

const DATA: Record<string, Indicator[]> = {
  // Built-in (Indicators tab)
  'technicals': [
    { name: '24-hour Volume' },
    { name: 'Accumulation/Distribution' },
    { name: 'Advance Decline Line' },
    { name: 'Advance Decline Ratio' },
    { name: 'Advance/Decline Ratio (Bars)' },
    { name: 'Arnaud Legoux Moving Average' },
    { name: 'Aroon' },
    { name: 'Aroon Oscillator', badge: 'NEW' },
    { name: 'Auto Fib Extension' },
    { name: 'Auto Fib Retracement' },
    { name: 'Auto Key Levels', badge: 'BETA' },
    { name: 'Auto Pitchfork' },
    { name: 'Auto Trendlines', badge: 'BETA' },
  ],
  'fundamentals': [
    { name: 'Earnings Per Share' },
    { name: 'Price/Earnings Ratio' },
    { name: 'Dividend Yield' },
  ],
  // Community (Strategies tab)
  'editors-picks': [
    { name: 'VWAP Pro', badge: 'NEW' },
    { name: 'Order Flow Heatmap' },
  ],
  'top': [
    { name: 'RSI Strategy' },
    { name: 'MACD Crossover' },
    { name: 'Bollinger Breakout' },
  ],
  'trending': [
    { name: 'SuperTrend Strategy' },
    { name: 'Ichimoku Cloud System' },
    { name: 'Stochastic RSI Pro' },
  ],
  'store': [
    { name: 'Elite Trader Suite', badge: 'NEW' },
    { name: 'AI Pattern Recognition' },
  ],
  // Personal (My Scripts tab)
  'my-scripts': [
    { name: 'My Custom RSI' },
    { name: 'Volume Spike Detector' },
  ],
  'purchased': [
    { name: 'Premium MACD Pack' },
    { name: 'Smart Money Concepts' },
  ],
};

const TAB_SECTIONS: Record<TabKey, { title: string; items: { key: string; label: string }[] }[]> = {
  'indicators': [
    {
      title: 'Built-in',
      items: [
        { key: 'technicals', label: 'Technicals' },
        { key: 'fundamentals', label: 'Fundamentals' },
      ],
    },
  ],
  'strategies': [
    {
      title: 'Community',
      items: [
        { key: 'editors-picks', label: 'Editors\' picks' },
        { key: 'top', label: 'Top' },
        { key: 'trending', label: 'Trending' },
        { key: 'store', label: 'Store' },
      ],
    },
  ],
  'my-scripts': [
    {
      title: 'Personal',
      items: [
        { key: 'my-scripts', label: 'My scripts' },
        { key: 'purchased', label: 'Purchased' },
      ],
    },
  ],
};

const TAB_LABELS: Record<TabKey, string> = {
  'indicators': 'Indicators',
  'strategies': 'Strategies',
  'my-scripts': 'My Scripts',
};

interface IndicatorsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function IndicatorsDialog({ open, onClose }: IndicatorsDialogProps) {
  const [tab, setTab] = useState<TabKey>('indicators');
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Khi đổi tab → reset query
  useEffect(() => {
    setQuery('');
  }, [tab]);

  if (!open) return null;

  const sections = TAB_SECTIONS[tab];
  const sectionKeys = sections.flatMap((s) => s.items.map((i) => i.key));
  const indicators = sectionKeys.flatMap((k) => DATA[k] ?? []);
  const filtered = indicators.filter((i) =>
    i.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/30 z-[100] flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-2xl w-[820px] max-w-[92vw] flex flex-col overflow-hidden"
        style={{ height: 'min(580px, 80vh)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {TAB_LABELS[tab]}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3">
          {(['indicators', 'strategies', 'my-scripts'] as TabKey[]).map((k) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  active
                    ? 'bg-gray-900 text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {TAB_LABELS[k]}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {/* List */}
          <div className="h-full overflow-y-auto px-5 py-3">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Script name
            </div>
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                No results match "{query}"
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map((ind) => (
                  <li
                    key={ind.name}
                    className="group flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-800">{ind.name}</span>
                      {ind.badge && (
                        <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          ind.badge === 'NEW'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {ind.badge}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-gray-500" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}