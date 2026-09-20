import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

type Scale = 'comfortable' | 'compact' | 'tight';

function pickScale(width: number, current: Scale): Scale {
  if (current === 'comfortable' && width < 1140) return 'compact';
  if (current === 'compact' && width >= 1140) return 'comfortable';
  if (current === 'compact' && width < 780) return 'tight';
  if (current === 'tight' && width >= 820) return 'compact';
  if (width >= 1140) return 'comfortable';
  if (width >= 820) return 'compact';
  return 'tight';
}

const SCALE = {
  comfortable: {
    fontBody: '15px',
    fontHeader: '13px',
    fontCurrency: '11px',
    fontSizeSuffix: '10px',
    fontSide: '13px',
    fontPnlUsd: '11px',
    colGap: '32px',
    padX: '20px',
    padYRow: '10px',
    padYHeader: '12px',
  },
  compact: {
    fontBody: '13px',
    fontHeader: '12px',
    fontCurrency: '10px',
    fontSizeSuffix: '9px',
    fontSide: '12px',
    fontPnlUsd: '10px',
    colGap: '20px',
    padX: '14px',
    padYRow: '8px',
    padYHeader: '10px',
  },
  tight: {
    fontBody: '12px',
    fontHeader: '11px',
    fontCurrency: '9px',
    fontSizeSuffix: '8px',
    fontSide: '11px',
    fontPnlUsd: '9px',
    colGap: '12px',
    padX: '10px',
    padYRow: '6px',
    padYHeader: '8px',
  },
} as const;

export interface TradeRecord {
  tradeNumber: number;
  date: string;
  rawTime?: number;
  type: 'Long' | 'Short';
  signal: 'Entry' | 'Exit';
  price: number;
  positionSizeUsd: number;
  tradePnlUsd: number;
  runUpUsd: number;
  drawdownUsd: number;
  cumulativePnlUsd: number;
}

interface TradePair {
  tradeNumber: number;
  type: 'Long' | 'Short';
  entry: TradeRecord;
  exit: TradeRecord;
}

interface TradeHistoryTableProps {
  trades: TradeRecord[];
  onSelectTrade?: (timeSec: number) => void;
}

const POSITIVE = '#16A34A';
const NEGATIVE = '#D94A4A';

function fmtMoney(v: number) {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtSize(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)} M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(2)} K`;
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtPctSigned(v: number) {
  if (v === 0) return '0.00%';
  const sign = v > 0 ? '+' : '−';
  return `${sign}${Math.abs(v).toFixed(2)}%`;
}

const ROW_HEIGHT: Record<Scale, number> = {
  comfortable: 56,
  compact: 48,
  tight: 40,
};

export function TradeHistoryTable({ trades, onSelectTrade }: TradeHistoryTableProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<Scale>('comfortable');
  const [scale, setScale] = useState<Scale>('comfortable');
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const pairs = useMemo<TradePair[]>(() => {
    const byNumber = new Map<number, { entry?: TradeRecord; exit?: TradeRecord; type?: 'Long' | 'Short' }>();
    for (const t of trades) {
      const slot = byNumber.get(t.tradeNumber) ?? {};
      if (t.signal === 'Entry') slot.entry = t;
      else slot.exit = t;
      slot.type = t.type;
      byNumber.set(t.tradeNumber, slot);
    }
    const out: TradePair[] = [];
    const keys = [...byNumber.keys()].sort((a, b) => b - a);
    for (const k of keys) {
      const slot = byNumber.get(k)!;
      if (slot.entry && slot.exit) {
        out.push({
          tradeNumber: k,
          type: slot.type!,
          entry: slot.entry,
          exit: slot.exit,
        });
      }
    }
    return out;
  }, [trades]);

  // Responsive scaling
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const next = pickScale(entry.contentRect.width, scaleRef.current);
        if (next !== scaleRef.current) {
          scaleRef.current = next;
          setScale(next);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track body height for virtualization
  useEffect(() => {
    const bodyEl = bodyRef.current;
    if (!bodyEl) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height || 600);
      }
    });
    ro.observe(bodyEl);
    return () => ro.disconnect();
  }, []);

  // Throttled scroll listener
  const onScroll = useCallback(() => {
    if (!bodyRef.current) return;
    const currentScroll = bodyRef.current.scrollTop;
    setScrollTop(currentScroll);
  }, []);

  const s = SCALE[scale];
  const rowH = ROW_HEIGHT[scale];

  // Virtualization window calculations
  const totalCount = pairs.length;
  const totalHeight = totalCount * rowH;
  const overscan = 5;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowH) - overscan);
  const visibleCount = Math.ceil(containerHeight / rowH) + 2 * overscan;
  const endIndex = Math.min(totalCount, startIndex + visibleCount);

  const visiblePairs = useMemo(() => {
    return pairs.slice(startIndex, endIndex).map((pair, idx) => ({
      pair,
      index: startIndex + idx,
    }));
  }, [pairs, startIndex, endIndex]);

  const offsetY = startIndex * rowH;

  return (
    <div ref={rootRef} className="w-full h-full flex flex-col bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden select-none">
      {/* Table Header */}
      <div
        className="grid border-b border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/70 font-semibold text-gray-500 dark:text-gray-400 shrink-0"
        style={{
          gridTemplateColumns: 'minmax(120px, 1.2fr) minmax(110px, 1fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(140px, 1.3fr)',
          paddingLeft: s.padX,
          paddingRight: s.padX,
          paddingTop: s.padYHeader,
          paddingBottom: s.padYHeader,
          gap: s.colGap,
          fontSize: s.fontHeader,
        }}
      >
        <div>Trade # / Type</div>
        <div>Signal / Date</div>
        <div className="text-right">Price / Size</div>
        <div className="text-right">Net P&L (USD)</div>
        <div className="text-right">Run-up / Drawdown</div>
        <div className="text-right">Cumulative P&L</div>
      </div>

      {/* Table Body (Virtualized Container) */}
      <div
        ref={bodyRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto relative"
      >
        {totalCount === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
            No trades executed yet in this backtest simulation.
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, position: 'relative', width: '100%' }}>
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
              className="divide-y divide-gray-100 dark:divide-gray-750"
            >
              {visiblePairs.map(({ pair }) => {
                const pnl = pair.exit.tradePnlUsd;
                const pnlPositive = pnl >= 0;
                const pnlPct = pair.entry.price > 0 ? ((pair.exit.price - pair.entry.price) / pair.entry.price) * 100 : 0;
                const effPnlPct = pair.type === 'Long' ? pnlPct : -pnlPct;

                return (
                  <div
                    key={pair.tradeNumber}
                    onClick={() => {
                      if (pair.entry.rawTime) onSelectTrade?.(pair.entry.rawTime);
                    }}
                    className="grid hover:bg-blue-50/40 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                    style={{
                      gridTemplateColumns: 'minmax(120px, 1.2fr) minmax(110px, 1fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(130px, 1.2fr) minmax(140px, 1.3fr)',
                      paddingLeft: s.padX,
                      paddingRight: s.padX,
                      paddingTop: s.padYRow,
                      paddingBottom: s.padYRow,
                      gap: s.colGap,
                      fontSize: s.fontBody,
                      height: `${rowH}px`,
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Col 1: Trade Number & Type */}
                    <div className="flex flex-col justify-center">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">#{pair.tradeNumber}</div>
                      <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: s.fontSide }}>
                        <span
                          className={`font-semibold px-1.5 py-0.2 rounded text-[10px] uppercase ${
                            pair.type === 'Long'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {pair.type}
                        </span>
                      </div>
                    </div>

                    {/* Col 2: Signal / Date */}
                    <div className="flex flex-col justify-center text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                        <span className="text-gray-400">Exit:</span>
                        <span className="tabular-nums">{pair.exit.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                        <span>Entry:</span>
                        <span className="tabular-nums">{pair.entry.date}</span>
                      </div>
                    </div>

                    {/* Col 3: Price / Size */}
                    <div className="flex flex-col justify-center text-right tabular-nums">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">${fmtMoney(pair.exit.price)}</div>
                      <div className="text-gray-400 text-xs mt-0.5">Entry: ${fmtMoney(pair.entry.price)}</div>
                    </div>

                    {/* Col 4: Net PnL */}
                    <div className="flex flex-col justify-center text-right tabular-nums">
                      <div
                        className="font-bold flex items-center justify-end gap-1"
                        style={{ color: pnlPositive ? POSITIVE : NEGATIVE }}
                      >
                        <span>{pnlPositive ? '+' : ''}${fmtMoney(pnl)}</span>
                      </div>
                      <div
                        className="text-xs font-medium mt-0.5"
                        style={{ color: effPnlPct >= 0 ? POSITIVE : NEGATIVE }}
                      >
                        {fmtPctSigned(effPnlPct)}
                      </div>
                    </div>

                    {/* Col 5: Runup / Drawdown */}
                    <div className="flex flex-col justify-center text-right tabular-nums text-xs">
                      <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                        +{fmtSize(pair.exit.runUpUsd)} USD
                      </div>
                      <div className="text-rose-500 dark:text-rose-400 font-medium mt-0.5">
                        -{fmtSize(Math.abs(pair.exit.drawdownUsd))} USD
                      </div>
                    </div>

                    {/* Col 6: Cumulative PnL */}
                    <div className="flex flex-col justify-center text-right tabular-nums">
                      <div
                        className="font-bold"
                        style={{ color: pair.exit.cumulativePnlUsd >= 0 ? POSITIVE : NEGATIVE }}
                      >
                        {pair.exit.cumulativePnlUsd >= 0 ? '+' : ''}${fmtMoney(pair.exit.cumulativePnlUsd)}
                      </div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        Size: ${fmtSize(pair.entry.positionSizeUsd)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
