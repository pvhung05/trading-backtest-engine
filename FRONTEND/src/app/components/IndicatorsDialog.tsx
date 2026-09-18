import { useEffect, useRef, useState } from 'react';
import { Search, X, ChevronRight, Zap } from 'lucide-react';

export type TabKey = 'indicators' | 'strategies' | 'my-scripts';

export interface IndicatorItem {
  name: string;
  badge?: 'NEW' | 'BETA';
  strategyType?: 'SMA_CROSS' | 'RSI' | 'MACD';
  description?: string;
}

const DATA: Record<string, IndicatorItem[]> = {
  // Built-in (Indicators tab)
  'technicals': [
    { name: 'Simple Moving Average (SMA)' },
    { name: 'Relative Strength Index (RSI)' },
    { name: 'Moving Average Convergence Divergence (MACD)' },
    { name: 'Exponential Moving Average (EMA)' },
    { name: 'Bollinger Bands' },
    { name: 'Volume Profile' },
    { name: 'Average True Range (ATR)' },
    { name: 'Stochastic Oscillator' },
  ],
  'fundamentals': [
    { name: '24h Market Volume' },
    { name: 'Order Book Depth' },
    { name: 'Liquidity Heatmap' },
  ],
  // Backend Engine Supported Strategies (Strategies tab)
  'engine-strategies': [
    {
      name: 'SMA Cross Strategy',
      badge: 'NEW',
      strategyType: 'SMA_CROSS',
      description: 'Dual Simple Moving Average crossover strategy (Fast & Slow).',
    },
    {
      name: 'RSI Strategy',
      badge: 'NEW',
      strategyType: 'RSI',
      description: 'Mean-reversion momentum strategy with Oversold/Overbought thresholds.',
    },
    {
      name: 'MACD Crossover',
      strategyType: 'MACD',
      description: 'Trend-following momentum strategy using MACD line & signal line.',
    },
  ],
  'community': [
    { name: 'Bollinger Breakout Strategy' },
    { name: 'SuperTrend Trend Tracker' },
    { name: 'Ichimoku Cloud System' },
  ],
  // Personal (My Scripts tab)
  'my-scripts': [
    { name: 'Custom Quantitative Momentum' },
    { name: 'Grid Trading Algorithm' },
  ],
};

const TAB_SECTIONS: Record<TabKey, { title: string; items: { key: string; label: string }[] }[]> = {
  'indicators': [
    {
      title: 'Built-in Indicators',
      items: [
        { key: 'technicals', label: 'Technical Indicators' },
        { key: 'fundamentals', label: 'Market Stats' },
      ],
    },
  ],
  'strategies': [
    {
      title: 'Backtest Engine Strategies',
      items: [
        { key: 'engine-strategies', label: 'Microservice Strategies (Live Backtest)' },
        { key: 'community', label: 'Other Presets' },
      ],
    },
  ],
  'my-scripts': [
    {
      title: 'Custom Scripts',
      items: [{ key: 'my-scripts', label: 'My Saved Strategies' }],
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
  onSelect?: (indicator: IndicatorItem) => void;
  initialTab?: TabKey;
}

export function IndicatorsDialog({
  open,
  onClose,
  onSelect,
  initialTab = 'indicators',
}: IndicatorsDialogProps) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    setQuery('');
  }, [tab]);

  if (!open) return null;

  const sections = TAB_SECTIONS[tab];
  const sectionKeys = sections.flatMap((s) => s.items.map((i) => i.key));
  const indicators = sectionKeys.flatMap((k) => DATA[k] ?? []);
  const filtered = indicators.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-xs z-[100] flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/98 dark:bg-gray-800/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 w-[820px] max-w-[92vw] flex flex-col overflow-hidden"
        style={{ height: 'min(580px, 80vh)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/80 dark:border-gray-700/80">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {TAB_LABELS[tab]}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search indicators and strategies…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 shadow-2xs transition-all"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-4 pb-1">
          {(['indicators', 'strategies', 'my-scripts'] as TabKey[]).map((k) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-1.5 text-sm rounded-full transition-all duration-150 active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 font-medium'
                }`}
              >
                {TAB_LABELS[k]}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-6 py-3">
            <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Available Scripts & Strategies
            </div>
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                No results match "{query}"
              </div>
            ) : (
              <ul className="space-y-1">
                {filtered.map((ind) => (
                  <li
                    key={ind.name}
                    onClick={() => {
                      onSelect?.(ind);
                      onClose();
                    }}
                    className="group flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-700/60 transition-all duration-150 active:scale-[0.99]"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        {ind.strategyType && (
                          <Zap className="size-3.5 text-amber-500 fill-amber-500" />
                        )}
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {ind.name}
                        </span>
                        {ind.badge && (
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              ind.badge === 'NEW'
                                ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40'
                                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40'
                            }`}
                          >
                            {ind.badge}
                          </span>
                        )}
                        {ind.strategyType && (
                          <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/40">
                            BACKTEST READY
                          </span>
                        )}
                      </div>
                      {ind.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {ind.description}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
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