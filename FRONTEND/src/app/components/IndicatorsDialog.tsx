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
  onSelect?: (indicator: Indicator) => void;
  initialTab?: TabKey;
}

export function IndicatorsDialog({ open, onClose, onSelect, initialTab = 'indicators' }: IndicatorsDialogProps) {
  const [tab, setTab] = useState<TabKey>(initialTab);
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
      className="fixed inset-0 bg-black/30 dark:bg-black/60 z-[100] flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[820px] max-w-[92vw] flex flex-col overflow-hidden"
        style={{ height: 'min(580px, 80vh)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {TAB_LABELS[tab]}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Script name
            </div>
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                No results match "{query}"
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((ind) => (
                  <li
                    key={ind.name}
                    onClick={() => {
                      onSelect?.(ind);
                      onClose();
                    }}
                    className="group flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60 -mx-2 px-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-800 dark:text-gray-200">{ind.name}</span>
                      {ind.badge && (
                        <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          ind.badge === 'NEW'
                            ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300'
                            : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
                        }`}>
                          {ind.badge}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
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