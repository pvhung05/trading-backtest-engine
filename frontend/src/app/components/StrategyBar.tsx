import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { TradeHistoryTable, TradeRecord } from './TradeHistoryTable';

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
  trades?: TradeRecord[];
  activeView?: 'metrics' | 'history' | 'period' | 'capital';
  onActiveViewChange?: (view: 'metrics' | 'history' | 'period' | 'capital') => void;
  onRunBacktest?: () => void;
  running?: boolean;
  // Persisted initial values from localStorage so the UI doesn't reset on reload.
  initialDateRange?: [string, string];
  initialCapital?: number;
  onDateRangeChange?: (range: [string, string]) => void;
  onCapitalChange?: (capital: number) => void;
}

type ViewKey = 'metrics' | 'history' | 'period' | 'capital';

const VIEW_BUTTONS: { key: ViewKey; label: string; Icon: typeof BarChart3 }[] = [
  { key: 'metrics', label: 'Metrics', Icon: BarChart3 },
  { key: 'history', label: 'Trade History', Icon: History },
  { key: 'period', label: 'Backtest Period', Icon: Calendar },
  { key: 'capital', label: 'Init Capital', Icon: DollarSign },
];

const DEFAULT_RANGE: [string, string] = ['2011-08-15', '2026-06-29'];

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatCapital(value: number) {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000) return `${value / 1_000}K`;
  return String(value);
}

const PRESETS = [10_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];

const SAMPLE_TRADES: TradeRecord[] = [
  // ---- Trade 1 — Long win, mid-range price ----
  { tradeNumber: 1,  date: '2024-03-12 09:30', type: 'Long',  signal: 'Entry', price: 38.97, positionSizeUsd: 97_425.00,    tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 0.00    },
  { tradeNumber: 1,  date: '2024-03-12 14:15', type: 'Long',  signal: 'Exit',  price: 41.22, positionSizeUsd: 103_050.00,   tradePnlUsd: 5_625.00, runUpUsd: 5_625.00, drawdownUsd: -812.50, cumulativePnlUsd: 5_625.00 },

  // ---- Trade 2 — Long loss ----
  { tradeNumber: 2,  date: '2024-03-18 10:05', type: 'Long',  signal: 'Entry', price: 42.50, positionSizeUsd: 106_250.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 5_625.00 },
  { tradeNumber: 2,  date: '2024-03-18 13:40', type: 'Long',  signal: 'Exit',  price: 40.10, positionSizeUsd: 100_250.00,   tradePnlUsd: -6_000.00, runUpUsd: 187.50, drawdownUsd: -6_000.00, cumulativePnlUsd: -375.00 },

  // ---- Trade 3 — Long win, big move ----
  { tradeNumber: 3,  date: '2024-04-02 09:30', type: 'Long',  signal: 'Entry', price: 39.92, positionSizeUsd: 99_800.00,    tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: -375.00 },
  { tradeNumber: 3,  date: '2024-04-02 15:55', type: 'Long',  signal: 'Exit',  price: 45.30, positionSizeUsd: 113_250.00,   tradePnlUsd: 13_450.00, runUpUsd: 13_450.00, drawdownUsd: -420.00, cumulativePnlUsd: 13_075.00 },

  // ---- Trade 4 — Short win (first short in the list) ----
  { tradeNumber: 4,  date: '2024-04-15 09:30', type: 'Short', signal: 'Entry', price: 48.20, positionSizeUsd: 120_500.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 13_075.00 },
  { tradeNumber: 4,  date: '2024-04-15 11:20', type: 'Short', signal: 'Exit',  price: 44.65, positionSizeUsd: 111_625.00,   tradePnlUsd: 8_875.00, runUpUsd: 8_875.00, drawdownUsd: -310.00, cumulativePnlUsd: 21_950.00 },

  // ---- Trade 5 — Short loss ----
  { tradeNumber: 5,  date: '2024-04-29 09:45', type: 'Short', signal: 'Entry', price: 46.10, positionSizeUsd: 115_250.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 21_950.00 },
  { tradeNumber: 5,  date: '2024-04-29 14:00', type: 'Short', signal: 'Exit',  price: 49.80, positionSizeUsd: 124_500.00,   tradePnlUsd: -9_250.00, runUpUsd: 120.00, drawdownUsd: -9_250.00, cumulativePnlUsd: 12_700.00 },

  // ---- Trade 6 — Long win (crypto-style 5-figure price) ----
  { tradeNumber: 6,  date: '2024-05-08 09:30', type: 'Long',  signal: 'Entry', price: 62_811.00, positionSizeUsd: 94_216_500.00, tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 12_700.00 },
  { tradeNumber: 6,  date: '2024-05-08 16:30', type: 'Long',  signal: 'Exit',  price: 65_245.00, positionSizeUsd: 97_867_500.00, tradePnlUsd: 3_651_000.00, runUpUsd: 3_651_000.00, drawdownUsd: -812_500.00, cumulativePnlUsd: 3_663_700.00 },

  // ---- Trade 7 — Long loss, big drawdown ----
  { tradeNumber: 7,  date: '2024-05-22 09:30', type: 'Long',  signal: 'Entry', price: 64_900.00, positionSizeUsd: 97_350_000.00, tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 3_663_700.00 },
  { tradeNumber: 7,  date: '2024-05-22 13:15', type: 'Long',  signal: 'Exit',  price: 61_400.00, positionSizeUsd: 92_100_000.00, tradePnlUsd: -5_250_000.00, runUpUsd: 0.00, drawdownUsd: -5_250_000.00, cumulativePnlUsd: -1_586_300.00 },

  // ---- Trade 8 — Short win (big) ----
  { tradeNumber: 8,  date: '2024-06-04 09:30', type: 'Short', signal: 'Entry', price: 67_800.00, positionSizeUsd: 101_700_000.00, tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: -1_586_300.00 },
  { tradeNumber: 8,  date: '2024-06-04 15:45', type: 'Short', signal: 'Exit',  price: 64_120.00, positionSizeUsd: 96_180_000.00,  tradePnlUsd: 5_520_000.00, runUpUsd: 5_520_000.00, drawdownUsd: -145_000.00, cumulativePnlUsd: 3_933_700.00 },

  // ---- Trade 9 — Long small win ----
  { tradeNumber: 9,  date: '2024-06-18 09:30', type: 'Long',  signal: 'Entry', price: 43.55, positionSizeUsd: 217_750.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 3_933_700.00 },
  { tradeNumber: 9,  date: '2024-06-18 11:50', type: 'Long',  signal: 'Exit',  price: 44.10, positionSizeUsd: 220_500.00,   tradePnlUsd: 2_750.00, runUpUsd: 2_750.00, drawdownUsd: -880.00, cumulativePnlUsd: 3_936_450.00 },

  // ---- Trade 10 — Long breakeven / tiny loss ----
  { tradeNumber: 10, date: '2024-07-02 09:30', type: 'Long',  signal: 'Entry', price: 44.80, positionSizeUsd: 224_000.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 3_936_450.00 },
  { tradeNumber: 10, date: '2024-07-02 14:20', type: 'Long',  signal: 'Exit',  price: 44.72, positionSizeUsd: 223_600.00,   tradePnlUsd: -400.00, runUpUsd: 480.00, drawdownUsd: -1_120.00, cumulativePnlUsd: 3_936_050.00 },

  // ---- Trade 11 — Short loss ----
  { tradeNumber: 11, date: '2024-07-15 09:30', type: 'Short', signal: 'Entry', price: 41.30, positionSizeUsd: 206_500.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 3_936_050.00 },
  { tradeNumber: 11, date: '2024-07-15 12:30', type: 'Short', signal: 'Exit',  price: 43.85, positionSizeUsd: 219_250.00,   tradePnlUsd: -12_750.00, runUpUsd: 0.00, drawdownUsd: -12_750.00, cumulativePnlUsd: 3_923_300.00 },

  // ---- Trade 12 — Long win, very high price (BTC) ----
  { tradeNumber: 12, date: '2024-08-01 09:30', type: 'Long',  signal: 'Entry', price: 71_240.00, positionSizeUsd: 56_992_000.00, tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 3_923_300.00 },
  { tradeNumber: 12, date: '2024-08-01 16:00', type: 'Long',  signal: 'Exit',  price: 74_820.00, positionSizeUsd: 59_856_000.00, tradePnlUsd: 2_864_000.00, runUpUsd: 2_864_000.00, drawdownUsd: -512_000.00, cumulativePnlUsd: 6_787_300.00 },

  // ---- Trade 13 — Short win ----
  { tradeNumber: 13, date: '2024-08-14 09:30', type: 'Short', signal: 'Entry', price: 73_100.00, positionSizeUsd: 58_480_000.00, tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 6_787_300.00 },
  { tradeNumber: 13, date: '2024-08-14 13:45', type: 'Short', signal: 'Exit',  price: 70_650.00, positionSizeUsd: 56_520_000.00, tradePnlUsd: 1_960_000.00, runUpUsd: 1_960_000.00, drawdownUsd: -88_000.00, cumulativePnlUsd: 8_747_300.00 },

  // ---- Trade 14 — Long loss ----
  { tradeNumber: 14, date: '2024-08-28 09:30', type: 'Long',  signal: 'Entry', price: 72_400.00, positionSizeUsd: 57_920_000.00, tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 8_747_300.00 },
  { tradeNumber: 14, date: '2024-08-28 11:15', type: 'Long',  signal: 'Exit',  price: 70_950.00, positionSizeUsd: 56_760_000.00, tradePnlUsd: -1_160_000.00, runUpUsd: 0.00, drawdownUsd: -1_160_000.00, cumulativePnlUsd: 7_587_300.00 },

  // ---- Trade 15 — Long win, mid-range ----
  { tradeNumber: 15, date: '2024-09-11 09:30', type: 'Long',  signal: 'Entry', price: 50.20, positionSizeUsd: 175_700.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 7_587_300.00 },
  { tradeNumber: 15, date: '2024-09-11 15:30', type: 'Long',  signal: 'Exit',  price: 52.85, positionSizeUsd: 184_975.00,   tradePnlUsd: 9_275.00, runUpUsd: 9_275.00, drawdownUsd: -245.00, cumulativePnlUsd: 7_596_575.00 },

  // ---- Trade 16 — Short loss ----
  { tradeNumber: 16, date: '2024-09-25 09:30', type: 'Short', signal: 'Entry', price: 54.30, positionSizeUsd: 190_050.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 7_596_575.00 },
  { tradeNumber: 16, date: '2024-09-25 14:10', type: 'Short', signal: 'Exit',  price: 56.75, positionSizeUsd: 198_625.00,   tradePnlUsd: -8_575.00, runUpUsd: 280.00, drawdownUsd: -8_575.00, cumulativePnlUsd: 7_588_000.00 },

  // ---- Trade 17 — Long win ----
  { tradeNumber: 17, date: '2024-10-09 09:30', type: 'Long',  signal: 'Entry', price: 58.10, positionSizeUsd: 203_350.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 7_588_000.00 },
  { tradeNumber: 17, date: '2024-10-09 11:45', type: 'Long',  signal: 'Exit',  price: 60.40, positionSizeUsd: 211_400.00,   tradePnlUsd: 8_050.00, runUpUsd: 8_050.00, drawdownUsd: -525.00, cumulativePnlUsd: 7_596_050.00 },

  // ---- Trade 18 — Short win ----
  { tradeNumber: 18, date: '2024-10-23 09:30', type: 'Short', signal: 'Entry', price: 61.20, positionSizeUsd: 214_200.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 7_596_050.00 },
  { tradeNumber: 18, date: '2024-10-23 13:20', type: 'Short', signal: 'Exit',  price: 58.85, positionSizeUsd: 205_975.00,   tradePnlUsd: 8_225.00, runUpUsd: 8_225.00, drawdownUsd: -140.00, cumulativePnlUsd: 7_604_275.00 },

  // ---- Trade 19 — Long small loss ----
  { tradeNumber: 19, date: '2024-11-06 09:30', type: 'Long',  signal: 'Entry', price: 57.40, positionSizeUsd: 200_900.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 7_604_275.00 },
  { tradeNumber: 19, date: '2024-11-06 10:55', type: 'Long',  signal: 'Exit',  price: 56.85, positionSizeUsd: 198_975.00,   tradePnlUsd: -1_925.00, runUpUsd: 122.50, drawdownUsd: -1_925.00, cumulativePnlUsd: 7_602_350.00 },

  // ---- Trade 20 — Long win (large) ----
  { tradeNumber: 20, date: '2024-11-20 09:30', type: 'Long',  signal: 'Entry', price: 59.30, positionSizeUsd: 207_550.00,   tradePnlUsd: 0.00,    runUpUsd: 0.00,    drawdownUsd: 0.00,   cumulativePnlUsd: 7_602_350.00 },
  { tradeNumber: 20, date: '2024-11-20 16:30', type: 'Long',  signal: 'Exit',  price: 63.80, positionSizeUsd: 223_300.00,   tradePnlUsd: 15_750.00, runUpUsd: 15_750.00, drawdownUsd: -490.00, cumulativePnlUsd: 7_618_100.00 },
];

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
  trades = SAMPLE_TRADES,
  activeView: activeViewProp = 'metrics',
  onActiveViewChange,
  onRunBacktest,
  running = false,
  initialDateRange = DEFAULT_RANGE,
  initialCapital = 1_000_000,
  onDateRangeChange,
  onCapitalChange,
}: StrategyBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeView = activeViewProp;
  const [activeStrategyName, setActiveStrategyName] = useState<string | null>(
    () => strategies[0]?.name ?? null
  );
  const [dateRange, setDateRange] = useState<[string, string]>(initialDateRange);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [capital, setCapital] = useState<number>(initialCapital);
  const [capitalOpen, setCapitalOpen] = useState(false);
  const [capitalDraft, setCapitalDraft] = useState<string>(String(initialCapital));
  const periodRef = useRef<HTMLDivElement>(null);
  const capitalRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Wrap setters so internal changes propagate to the parent (which
  // owns the persisted state). The parent's onChange handler writes
  // to localStorage; the prop coming back in keeps these useEffects
  // idempotent and safe to fire on every render.
  const updateDateRange = (next: [string, string]) => {
    setDateRange(next);
    onDateRangeChange?.(next);
  };
  const updateCapital = (next: number) => {
    setCapital(next);
    onCapitalChange?.(next);
  };

  // Sync internal state with persisted parent values on prop change
  // (covers the case where the parent restores from localStorage after mount).
  useEffect(() => {
    setDateRange(initialDateRange);
  }, [initialDateRange]);
  useEffect(() => {
    setCapital(initialCapital);
    setCapitalDraft(String(initialCapital));
  }, [initialCapital]);

  useEffect(() => {
    if (!periodOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [periodOpen]);

  useEffect(() => {
    if (!capitalOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (capitalRef.current && !capitalRef.current.contains(e.target as Node)) {
        setCapitalOpen(false);
        setCapitalDraft(String(capital));
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [capitalOpen, capital]);

  // Keep `activeStrategyName` valid: if it points to a strategy that no
  // longer exists (because the user closed it), fall back to the first
  // remaining one so the UI never highlights a "ghost" tab.
  useEffect(() => {
    if (strategies.length === 0) {
      if (activeStrategyName !== null) setActiveStrategyName(null);
      return;
    }
    if (!strategies.some((s) => s.name === activeStrategyName)) {
      setActiveStrategyName(strategies[0].name);
    }
  }, [strategies, activeStrategyName]);

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Only intercept vertical wheel inside the tab strip → scroll horizontally.
      // Trackpad users get native horizontal deltaX, so let it pass.
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (strategies.length === 0) return null;

  const handleViewClick = (key: ViewKey) => {
    onActiveViewChange?.(key);
    onSelectView?.(key);
  };

  return (
    <div className="flex flex-col bg-gray-100 dark:bg-gray-900 select-none h-full min-h-0 text-gray-900 dark:text-gray-100">
      {/* Row 1: strategy tabs */}
      <div className="h-7 flex items-end">
        <div
          ref={tabsScrollRef}
          className="flex items-end min-w-0 flex-1 overflow-x-auto overflow-y-hidden strategy-tabs-scroll"
        >
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 shrink-0 mb-1.5" />
          {strategies.map((s) => {
            const isActive = s.name === activeStrategyName;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => setActiveStrategyName(s.name)}
                className={`group flex items-center h-7 px-3 rounded-t-md -mb-px cursor-pointer shrink-0 transition-colors border-t border-l border-r ${
                  isActive
                    ? // Active tab: darker fill + bolder text + bottom border
                      // matches the row-2 background so the tab visually
                      // "connects" to the toolbar below it.
                      'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                    : // Inactive tab: subtle, brightens on hover.
                      'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                <span
                  className={`text-xs whitespace-nowrap ${
                    isActive
                      ? 'font-semibold text-gray-900 dark:text-gray-100'
                      : 'font-medium text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {s.name}
                </span>
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove?.(s.name);
                  }}
                  className="ml-2 size-4 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Close strategy"
                >
                  <X className="size-3" />
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0 px-2 pb-0.25">
          {!chartHidden && (expanded ? (
            <button
              onClick={() => onCollapsePanel?.()}
              className="size-7 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Collapse strategy panel"
            >
              <ChevronDown className="size-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setCollapsed(false);
                onExpandPanel?.();
              }}
              className="size-7 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Expand strategy panel"
            >
              <ChevronUp className="size-4" />
            </button>
          ))}
          <button
            onClick={() => {
              if (chartHidden) {
                onRestorePanel?.();
                return;
              }
              setCollapsed(false);
              onMaximizePanel?.();
            }}
            className={`size-7 flex items-center justify-center rounded transition-colors ${
              chartHidden
                ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={chartHidden ? 'Exit fullscreen' : 'Maximize strategy panel (hide chart)'}
          >
            {chartHidden ? <Minimize2 className="size-3.5" /> : <Maximize className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Row 2: view toolbar (Metrics / History / Period / Capital) */}
      <div className="h-8 flex items-center gap-1 px-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {VIEW_BUTTONS.map(({ key, label, Icon }) => {
          if (key === 'period') {
            return (
              <div key={key} ref={periodRef} className="relative">
                <button
                  onClick={() => setPeriodOpen((o) => !o)}
                  // Pure config control: toggles the date-range popover
                  // but must NOT switch `activeView`, otherwise the
                  // results panel below would jump away from whatever
                  // the user is currently looking at (metrics/history).
                  className="h-7 flex items-center gap-1.5 pl-2 pr-1.5 rounded transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={label}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="text-[11px] font-medium whitespace-nowrap tabular-nums">
                    {formatDate(dateRange[0])} — {formatDate(dateRange[1])}
                  </span>
                  <ChevronDown
                    className={`size-3 shrink-0 transition-transform ${
                      periodOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {periodOpen && (
                  <div className="absolute z-50 left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3 min-w-[260px]">
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <span className="w-14">From</span>
                        <input
                          type="date"
                          value={dateRange[0]}
                          max={dateRange[1]}
                          onChange={(e) =>
                            updateDateRange([e.target.value, dateRange[1]])
                          }
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <span className="w-14">To</span>
                        <input
                          type="date"
                          value={dateRange[1]}
                          min={dateRange[0]}
                          onChange={(e) =>
                            updateDateRange([dateRange[0], e.target.value])
                          }
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                        />
                      </label>
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
                  onClick={() => {
                    setCapitalOpen((o) => !o);
                    if (!capitalOpen) setCapitalDraft(String(capital));
                  }}
                  // Pure config control: toggles the capital popover but
                  // does NOT change `activeView` — Metrics/History alone
                  // decides what is rendered in the results panel.
                  className="h-7 flex items-center gap-1.5 pl-2 pr-1.5 rounded transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={label}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="text-[11px] font-medium whitespace-nowrap tabular-nums">
                    {formatCapital(capital)} USD
                  </span>
                  <ChevronDown
                    className={`size-3 shrink-0 transition-transform ${
                      capitalOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {capitalOpen && (
                  <div className="absolute z-50 left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3 min-w-[220px]">
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="w-14">Amount</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={capitalDraft}
                        onChange={(e) => setCapitalDraft(e.target.value)}
                        onBlur={commitCapital}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            commitCapital();
                            setCapitalOpen(false);
                          }
                        }}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                      />
                    </label>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {PRESETS.map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            updateCapital(v);
                            setCapitalDraft(String(v));
                          }}
                          className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                            capital === v
                              ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
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
              onClick={() => handleViewClick(key)}
              className={`size-7 flex items-center justify-center rounded transition-colors ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={label}
            >
              <Icon className="size-3.5" />
            </button>
          );
        })}
        {/* Black "Run" button — mirrors a typical "Publish"-style CTA
            on the right side of the toolbar. Just passing `onRunBacktest`
            is enough to enable it; `running` is an optional hint that
            greys the button out while a backtest is in flight. */}
        <button
          type="button"
          onClick={onRunBacktest}
          disabled={!onRunBacktest || running}
          className="ml-auto h-7 px-3 flex items-center gap-1.5 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-200 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed text-white dark:text-gray-900 rounded text-[11px] font-semibold transition-colors"
          title="Run backtest"
        >
          <Play className="size-3" />
          <span>{running ? 'Running…' : 'Run'}</span>
        </button>
      </div>

      {/* Row 3: history table (visible only while the History icon is active) */}
      {activeView === 'history' && <TradeHistoryTable trades={trades} />}
    </div>
  );
}