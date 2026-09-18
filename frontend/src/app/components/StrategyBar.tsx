import { useEffect, useRef, useState, useMemo } from 'react';
import {
  ChevronUp,
  Maximize,
  Minimize2,
  X,
  Circle,
  BarChart3,
  History,
  Calendar,
  DollarSign,
  ChevronDown,
  Play,
  Sliders,
  TrendingUp,
  TrendingDown,
  Percent,
  ShieldAlert,
  Award,
  Zap,
  Loader2,
} from 'lucide-react';
import { TradeHistoryTable, TradeRecord } from './TradeHistoryTable';
import { useOHLCV } from './OHLCVContext';
import { backtestApi, BacktestRunDetailResponse, MetricsDetail } from '../services/backtestApi';

export interface ActiveStrategy {
  name: string;
  badge?: 'NEW' | 'BETA';
}

interface StrategyBarProps {
  strategies: ActiveStrategy[];
  onRemove?: (name: string) => void;
  onSelectView?: (view: 'metrics' | 'history' | 'period' | 'capital') => void;
  onExpandPanel?: () => void;
  onMaximizePanel?: () => void;
  onRestorePanel?: () => void;
  chartHidden?: boolean;
  expanded?: boolean;
  onCollapsePanel?: () => void;
  activeView?: 'metrics' | 'history' | 'period' | 'capital';
  onActiveViewChange?: (view: 'metrics' | 'history' | 'period' | 'capital') => void;
  initialDateRange?: [string, string];
  initialCapital?: number;
  onDateRangeChange?: (range: [string, string]) => void;
  onCapitalChange?: (capital: number) => void;
}

type ViewKey = 'metrics' | 'history' | 'period' | 'capital';

const VIEW_BUTTONS: { key: ViewKey; label: string; Icon: typeof BarChart3 }[] = [
  { key: 'metrics', label: 'Performance Metrics', Icon: BarChart3 },
  { key: 'history', label: 'Trade History', Icon: History },
  { key: 'period', label: 'Backtest Period', Icon: Calendar },
  { key: 'capital', label: 'Initial Capital', Icon: DollarSign },
];

const DEFAULT_RANGE: [string, string] = ['2024-01-01', '2024-06-01'];

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatCapital(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function formatNum(v: number | undefined | null, decimals = 2) {
  if (v === undefined || v === null || isNaN(v)) return '—';
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const PRESETS = [10_000, 50_000, 100_000, 500_000, 1_000_000];

export function StrategyBar({
  strategies,
  onRemove,
  onSelectView,
  onExpandPanel,
  onMaximizePanel,
  onRestorePanel,
  chartHidden = false,
  expanded = false,
  onCollapsePanel,
  activeView: activeViewProp = 'metrics',
  onActiveViewChange,
  initialDateRange = DEFAULT_RANGE,
  initialCapital = 10_000,
  onDateRangeChange,
  onCapitalChange,
}: StrategyBarProps) {
  const {
    symbol,
    interval,
    backtestResult,
    setBacktestResult,
    isBacktestRunning,
    setIsBacktestRunning,
    setSelectedTradeTime,
  } = useOHLCV();

  const [activeStrategyName, setActiveStrategyName] = useState<string | null>(
    () => strategies[0]?.name ?? null
  );
  const [dateRange, setDateRange] = useState<[string, string]>(initialDateRange);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [capital, setCapital] = useState<number>(initialCapital);
  const [capitalOpen, setCapitalOpen] = useState(false);
  const [capitalDraft, setCapitalDraft] = useState<string>(String(initialCapital));
  const [paramsOpen, setParamsOpen] = useState(false);

  // Strategy Parameters State
  const [strategyParams, setStrategyParams] = useState<Record<string, any>>({
    shortPeriod: 10,
    longPeriod: 30,
    rsiPeriod: 14,
    oversoldThreshold: 30,
    overboughtThreshold: 70,
    signalPeriod: 9,
  });

  const [error, setError] = useState<string | null>(null);

  const activeView = activeViewProp;
  const periodRef = useRef<HTMLDivElement>(null);
  const capitalRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Detect active strategy type
  const detectedStrategyType = useMemo(() => {
    if (!activeStrategyName) return 'SMA_CROSS';
    const lower = activeStrategyName.toLowerCase();
    if (lower.includes('rsi')) return 'RSI';
    if (lower.includes('macd')) return 'MACD';
    return 'SMA_CROSS';
  }, [activeStrategyName]);

  const updateDateRange = (next: [string, string]) => {
    setDateRange(next);
    onDateRangeChange?.(next);
  };

  const updateCapital = (next: number) => {
    setCapital(next);
    onCapitalChange?.(next);
  };

  useEffect(() => {
    setDateRange(initialDateRange);
  }, [initialDateRange]);

  useEffect(() => {
    setCapital(initialCapital);
    setCapitalDraft(String(initialCapital));
  }, [initialCapital]);

  useEffect(() => {
    if (strategies.length > 0 && !strategies.some((s) => s.name === activeStrategyName)) {
      setActiveStrategyName(strategies[0].name);
    }
  }, [strategies, activeStrategyName]);

  // Execute Backtest on Backend
  const handleRunBacktest = async () => {
    const cleanSymbol = symbol.replace('/', '').toUpperCase();
    setIsBacktestRunning(true);
    setError(null);

    // Build strategy params
    let params: Record<string, any> = {};
    if (detectedStrategyType === 'SMA_CROSS') {
      params = {
        shortPeriod: Number(strategyParams.shortPeriod) || 10,
        longPeriod: Number(strategyParams.longPeriod) || 30,
      };
    } else if (detectedStrategyType === 'RSI') {
      params = {
        period: Number(strategyParams.rsiPeriod) || 14,
        oversold: Number(strategyParams.oversoldThreshold) || 30.0,
        overbought: Number(strategyParams.overboughtThreshold) || 70.0,
      };
    } else if (detectedStrategyType === 'MACD') {
      params = {
        shortPeriod: Number(strategyParams.shortPeriod) || 12,
        longPeriod: Number(strategyParams.longPeriod) || 26,
        signalPeriod: Number(strategyParams.signalPeriod) || 9,
      };
    }

    try {
      const payload = {
        symbol: cleanSymbol,
        timeframe: interval,
        startTime: `${dateRange[0]}T00:00:00Z`,
        endTime: `${dateRange[1]}T23:59:59Z`,
        strategyType: detectedStrategyType,
        strategyParams: { params },
        initialCapital: capital,
        commissionRate: 0.001,
        slippageRate: 0.0005,
        positionSizePercent: 100.0,
      };

      const result = await backtestApi.runBacktest(payload);
      setBacktestResult(result);
      if (!expanded) {
        onExpandPanel?.();
      }
    } catch (err: any) {
      console.error('[StrategyBar] Backtest failed:', err);
      setError(err?.message || 'Failed to run backtest. Make sure Backtest Service is running.');
    } finally {
      setIsBacktestRunning(false);
    }
  };

  // Convert Backtest Trades from API to Table Records
  const formattedTrades = useMemo<TradeRecord[]>(() => {
    if (!backtestResult?.trades) return [];

    return backtestResult.trades.map((t, index) => {
      // e.g. "1 Long" -> tradeNumber: 1, type: "Long"
      const parts = t.tradeNumberWithSide.split(' ');
      const tradeNumber = parseInt(parts[0], 10) || index + 1;
      const type: 'Long' | 'Short' = parts[1]?.toLowerCase() === 'short' ? 'Short' : 'Long';
      const signal: 'Entry' | 'Exit' = t.type.toLowerCase().includes('entry') ? 'Entry' : 'Exit';
      const rawTime = t.dateTime ? Math.floor(new Date(t.dateTime).getTime() / 1000) : undefined;

      return {
        tradeNumber,
        date: t.dateTime ? new Date(t.dateTime).toLocaleString('en-US') : '—',
        rawTime,
        type,
        signal,
        price: Number(t.price) || 0,
        positionSizeUsd: Number(t.sizeUsd) || 0,
        tradePnlUsd: Number(t.netPnl) || 0,
        runUpUsd: Number(t.favorableExcursion) || 0,
        drawdownUsd: Number(t.adverseExcursion) || 0,
        cumulativePnlUsd: Number(t.cumulativePnl) || 0,
      };
    });
  }, [backtestResult]);

  if (strategies.length === 0) return null;

  const metrics: MetricsDetail | undefined = backtestResult?.metrics;

  return (
    <div className="flex flex-col bg-gray-100 dark:bg-gray-900 select-none h-full min-h-0 text-gray-900 dark:text-gray-100">
      {/* Row 1: Strategy Tabs */}
      <div className="h-7.5 flex items-end">
        <div
          ref={tabsScrollRef}
          className="flex items-end min-w-0 flex-1 overflow-x-auto overflow-y-hidden strategy-tabs-scroll px-1"
        >
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 shrink-0 mb-1.5" />
          {strategies.map((s) => {
            const isActive = s.name === activeStrategyName;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => setActiveStrategyName(s.name)}
                className={`group flex items-center h-7 px-3 rounded-t-lg -mb-px cursor-pointer shrink-0 transition-all duration-150 border-t border-l border-r ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-gray-900 dark:text-gray-100 font-semibold'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium'
                }`}
                title={s.name}
              >
                <Circle
                  className={`size-1.5 shrink-0 mr-1.5 ${
                    isActive
                      ? 'fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400'
                      : 'fill-blue-400 text-blue-400 dark:fill-blue-500 dark:text-blue-500'
                  }`}
                />
                <span className="text-xs whitespace-nowrap">{s.name}</span>
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.(s.name);
                  }}
                  className="ml-2 size-4 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/80 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                  title="Close strategy"
                >
                  <X className="size-3" />
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel controls */}
        <div className="flex items-center gap-1 shrink-0 px-2 pb-0.5">
          {!chartHidden && (expanded ? (
            <button
              onClick={() => onCollapsePanel?.()}
              className="size-7 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all"
              title="Collapse strategy panel"
            >
              <ChevronDown className="size-4" />
            </button>
          ) : (
            <button
              onClick={() => onExpandPanel?.()}
              className="size-7 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all"
              title="Expand strategy panel"
            >
              <ChevronUp className="size-4" />
            </button>
          ))}
          <button
            onClick={() => (chartHidden ? onRestorePanel?.() : onMaximizePanel?.())}
            className="size-7 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all"
            title={chartHidden ? 'Restore chart' : 'Maximize strategy panel'}
          >
            {chartHidden ? <Minimize2 className="size-3.5" /> : <Maximize className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Row 2: View Toolbar */}
      <div className="h-9 flex items-center gap-1.5 px-2.5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xs">
        {VIEW_BUTTONS.map(({ key, label, Icon }) => {
          if (key === 'period') {
            return (
              <div key={key} ref={periodRef} className="relative">
                <button
                  onClick={() => setPeriodOpen((o) => !o)}
                  className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/70 font-medium"
                  title={label}
                >
                  <Icon className="size-3.5 shrink-0 text-blue-500" />
                  <span className="text-[11px] whitespace-nowrap tabular-nums">
                    {formatDate(dateRange[0])} — {formatDate(dateRange[1])}
                  </span>
                  <ChevronDown className={`size-3 transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                </button>
                {periodOpen && (
                  <div className="absolute z-50 left-0 top-full mt-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3.5 min-w-[270px]">
                    <div className="flex flex-col gap-2.5">
                      <label className="flex items-center justify-between gap-2 text-xs">
                        <span className="w-14 font-medium text-gray-600 dark:text-gray-300">From</span>
                        <input
                          type="date"
                          value={dateRange[0]}
                          max={dateRange[1]}
                          onChange={(e) => updateDateRange([e.target.value, dateRange[1]])}
                          className="flex-1 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 text-xs">
                        <span className="w-14 font-medium text-gray-600 dark:text-gray-300">To</span>
                        <input
                          type="date"
                          value={dateRange[1]}
                          min={dateRange[0]}
                          onChange={(e) => updateDateRange([dateRange[0], e.target.value])}
                          className="flex-1 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </label>
                      <div className="pt-1.5 flex flex-wrap gap-1.5 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(start.getDate() - 30);
                            updateDateRange([start.toISOString().split('T')[0], end.toISOString().split('T')[0]]);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        >
                          Last 30D
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(start.getDate() - 90);
                            updateDateRange([start.toISOString().split('T')[0], end.toISOString().split('T')[0]]);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        >
                          Last 90D
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDateRange(['2024-01-01', '2024-06-01'])}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        >
                          2024 H1
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDateRange(['2024-01-01', '2024-12-31'])}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        >
                          Full 2024
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }
          if (key === 'capital') {
            const commitCapital = () => {
              const parsed = Number(capitalDraft.replace(/[^0-9.]/g, ''));
              if (!Number.isNaN(parsed) && parsed > 0) updateCapital(parsed);
              else setCapitalDraft(String(capital));
            };
            return (
              <div key={key} ref={capitalRef} className="relative">
                <button
                  onClick={() => setCapitalOpen((o) => !o)}
                  className="h-7 flex items-center gap-1.5 px-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/70 font-medium"
                  title={label}
                >
                  <Icon className="size-3.5 shrink-0 text-emerald-500" />
                  <span className="text-[11px] whitespace-nowrap tabular-nums">
                    {formatCapital(capital)} USD
                  </span>
                  <ChevronDown className={`size-3 transition-transform ${capitalOpen ? 'rotate-180' : ''}`} />
                </button>
                {capitalOpen && (
                  <div className="absolute z-50 left-0 top-full mt-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3.5 min-w-[240px]">
                    <label className="flex items-center gap-2 text-xs">
                      <span className="w-14 font-medium text-gray-600 dark:text-gray-300">Amount</span>
                      <input
                        type="text"
                        value={capitalDraft}
                        onChange={(e) => setCapitalDraft(e.target.value)}
                        onBlur={commitCapital}
                        className="flex-1 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </label>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {PRESETS.map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            updateCapital(v);
                            setCapitalDraft(String(v));
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${
                            capital === v
                              ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 text-blue-700 dark:text-blue-300'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {formatCapital(v)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
          const isActive = activeView === key;
          return (
            <button
              key={key}
              onClick={() => {
                onActiveViewChange?.(key);
                onSelectView?.(key);
              }}
              className={`h-7 px-2.5 flex items-center gap-1.5 rounded-lg text-xs transition-all ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/70'
              }`}
              title={label}
            >
              <Icon className="size-3.5" />
              <span>{label}</span>
            </button>
          );
        })}

        {/* Strategy Parameters Settings */}
        <div ref={paramsRef} className="relative">
          <button
            onClick={() => setParamsOpen((o) => !o)}
            className="h-7 px-2.5 flex items-center gap-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70 font-medium"
            title="Configure Strategy Parameters"
          >
            <Sliders className="size-3.5 text-purple-500" />
            <span>Params ({detectedStrategyType})</span>
          </button>

          {paramsOpen && (
            <div className="absolute z-50 left-0 top-full mt-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3.5 min-w-[260px]">
              <div className="text-xs font-semibold mb-2.5 text-gray-800 dark:text-gray-200">
                {detectedStrategyType} Settings
              </div>
              {detectedStrategyType === 'SMA_CROSS' && (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">Fast SMA Period</span>
                    <input
                      type="number"
                      value={strategyParams.shortPeriod || 10}
                      onChange={(e) =>
                        setStrategyParams((p) => ({ ...p, shortPeriod: parseInt(e.target.value) || 10 }))
                      }
                      className="w-20 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-right"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">Slow SMA Period</span>
                    <input
                      type="number"
                      value={strategyParams.longPeriod || 30}
                      onChange={(e) =>
                        setStrategyParams((p) => ({ ...p, longPeriod: parseInt(e.target.value) || 30 }))
                      }
                      className="w-20 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-right"
                    />
                  </label>
                </div>
              )}
              {detectedStrategyType === 'RSI' && (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">RSI Period</span>
                    <input
                      type="number"
                      value={strategyParams.rsiPeriod || 14}
                      onChange={(e) =>
                        setStrategyParams((p) => ({ ...p, rsiPeriod: parseInt(e.target.value) || 14 }))
                      }
                      className="w-20 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-right"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">Oversold Level</span>
                    <input
                      type="number"
                      value={strategyParams.oversoldThreshold || 30}
                      onChange={(e) =>
                        setStrategyParams((p) => ({ ...p, oversoldThreshold: parseFloat(e.target.value) || 30 }))
                      }
                      className="w-20 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-right"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">Overbought Level</span>
                    <input
                      type="number"
                      value={strategyParams.overboughtThreshold || 70}
                      onChange={(e) =>
                        setStrategyParams((p) => ({ ...p, overboughtThreshold: parseFloat(e.target.value) || 70 }))
                      }
                      className="w-20 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-right"
                    />
                  </label>
                </div>
              )}
              {detectedStrategyType === 'MACD' && (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">Fast EMA</span>
                    <input
                      type="number"
                      value={strategyParams.shortPeriod || 12}
                      onChange={(e) =>
                        setStrategyParams((p) => ({ ...p, shortPeriod: parseInt(e.target.value) || 12 }))
                      }
                      className="w-20 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-right"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">Slow EMA</span>
                    <input
                      type="number"
                      value={strategyParams.longPeriod || 26}
                      onChange={(e) =>
                        setStrategyParams((p) => ({ ...p, longPeriod: parseInt(e.target.value) || 26 }))
                      }
                      className="w-20 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-right"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-300">Signal Period</span>
                    <input
                      type="number"
                      value={strategyParams.signalPeriod || 9}
                      onChange={(e) =>
                        setStrategyParams((p) => ({ ...p, signalPeriod: parseInt(e.target.value) || 9 }))
                      }
                      className="w-20 px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-right"
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Run Backtest CTA */}
        <button
          type="button"
          onClick={handleRunBacktest}
          disabled={isBacktestRunning}
          className="ml-auto h-7 px-4 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          title="Run Microservice Backtest"
        >
          {isBacktestRunning ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3 fill-current" />
          )}
          <span>{isBacktestRunning ? 'Simulating…' : 'Run Backtest'}</span>
        </button>
      </div>

      {/* Error notification */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-950/60 border-t border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Row 3: Content Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeView === 'history' && (
          <TradeHistoryTable trades={formattedTrades} onSelectTrade={setSelectedTradeTime} />
        )}

        {activeView === 'metrics' && (
          <div className="p-4 overflow-y-auto">
            {!metrics ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center text-gray-500 dark:text-gray-400">
                <Zap className="size-8 text-amber-500" />
                <div className="text-sm font-medium">Ready to run backtest simulation</div>
                <div className="text-xs max-w-sm">
                  Click the <b>Run Backtest</b> button above to execute this strategy against historical data from Binance.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* Net Profit */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Return</div>
                  <div
                    className={`text-lg font-bold mt-1 tabular-nums ${
                      metrics.totalReturnPercent >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {metrics.totalReturnPercent >= 0 ? '+' : ''}
                    {formatNum(metrics.totalReturnPercent)}%
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 tabular-nums">
                    Final: ${formatNum(metrics.finalBalance)}
                  </div>
                </div>

                {/* Win Rate */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Win Rate</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
                    {formatNum(metrics.winRate)}%
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {metrics.winningTrades}W / {metrics.losingTrades}L
                  </div>
                </div>

                {/* Profit Factor */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Profit Factor</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
                    {formatNum(metrics.profitFactor)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Avg W/L: {formatNum(metrics.rewardRiskRatio)}
                  </div>
                </div>

                {/* Max Drawdown */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Max Drawdown</div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400 mt-1 tabular-nums">
                    {formatNum(metrics.maxDrawdown)}%
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Recovery: {formatNum(metrics.recoveryFactor)}
                  </div>
                </div>

                {/* Sharpe & Sortino */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Sharpe / Sortino</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
                    {formatNum(metrics.sharpeRatio)} / {formatNum(metrics.sortinoRatio)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Calmar: {formatNum(metrics.calmarRatio)}
                  </div>
                </div>

                {/* Total Trades */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Trades</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 tabular-nums">
                    {metrics.totalTrades}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Best: +${formatNum(metrics.bestTrade)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}