import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

type Scale = 'comfortable' | 'compact' | 'tight';

/**
 * Map panel width → scale tier. We use a tiny piece of hysteresis so that
 * dragging the watchlist slowly across a threshold doesn't make the table
 * snap up/down by a full tier on each frame.
 */
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
    fontBody: '14px',
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

/**
 * A single completed round-trip: an Entry and its matching Exit share the
 * same tradeNumber. We render them stacked vertically (Exit above, Entry
 * below) so the row pair reads like a TradingView Strategy Tester trade.
 */
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

export function TradeHistoryTable({ trades, onSelectTrade }: TradeHistoryTableProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<Scale>('comfortable');
  const [scale, setScale] = useState<Scale>('comfortable');

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
    const keys = [...byNumber.keys()].sort((a, b) => a - b);
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

  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      const rect = body.getBoundingClientRect();
      const overBody =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (overBody) return;
      e.preventDefault();
      body.scrollTop += e.deltaY;
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    return () => root.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;

    const SCROLLBAR_GUTTER = 6;
    let scaleRafId: number | null = null;
    const ro = new ResizeObserver((entries) => {
      if (scaleRafId !== null) return;
      scaleRafId = requestAnimationFrame(() => {
        scaleRafId = null;
        for (const entry of entries) {
          const inner = Math.max(0, entry.contentRect.width - SCROLLBAR_GUTTER);
          const next = pickScale(inner, scaleRef.current);
          if (next !== scaleRef.current) {
            scaleRef.current = next;
            setScale(next);
          }
        }
      });
    });
    ro.observe(root);
    return () => {
      if (scaleRafId !== null) cancelAnimationFrame(scaleRafId);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  if (pairs.length === 0) {
    return (
      <div
        ref={rootRef}
        className="flex-1 min-h-0 flex items-center justify-center px-4 py-8 bg-white dark:bg-gray-800 font-sans select-none"
      >
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">No trade history available.</div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Run a backtest to see every entry/exit here.
          </div>
        </div>
      </div>
    );
  }

  // 7 columns matching the TradingView Strategy Tester layout:
  //   # | Type | Date / time | Price | Position Size | Net PnL | Return
  const COL_TEMPLATE_BY_SCALE: Record<Scale, string> = {
    comfortable:
      'minmax(120px,max-content) ' +
      'minmax(80px,max-content) ' +
      'minmax(180px,max-content) ' +
      'minmax(160px,max-content) ' +
      'minmax(180px,max-content) ' +
      'minmax(160px,max-content) ' +
      'minmax(110px,max-content)',
    compact:
      'minmax(96px,max-content) ' +
      'minmax(64px,max-content) ' +
      'minmax(140px,max-content) ' +
      'minmax(120px,max-content) ' +
      'minmax(140px,max-content) ' +
      'minmax(120px,max-content) ' +
      'minmax(88px,max-content)',
    tight:
      'minmax(72px,max-content) ' +
      'minmax(54px,max-content) ' +
      'minmax(108px,max-content) ' +
      'minmax(90px,max-content) ' +
      'minmax(108px,max-content) ' +
      'minmax(90px,max-content) ' +
      'minmax(68px,max-content)',
  };

  const S = SCALE[scale];
  const COL_TEMPLATE = COL_TEMPLATE_BY_SCALE[scale];

  const F = {
    body: S.fontBody,
    header: S.fontHeader,
    currency: S.fontCurrency,
    sizeSuffix: S.fontSizeSuffix,
    side: S.fontSide,
    pnlUsd: S.fontPnlUsd,
  };

  return (
    <div
      ref={rootRef}
      className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-gray-800 font-sans select-none text-gray-900 dark:text-gray-100"
    >
      {/* Scrollable container for both header and body */}
      <div className="flex-1 min-h-0 overflow-x-auto flex flex-col">
        {/* Sticky Header */}
        <div
          className="sticky top-0 z-10 grid items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-850/90 backdrop-blur-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0"
          style={{
            gridTemplateColumns: COL_TEMPLATE,
            columnGap: S.colGap,
            fontSize: F.header,
            minWidth: 'max-content',
          }}
        >
          <div style={{ paddingLeft: S.padX, paddingRight: S.padX, paddingTop: S.padYHeader, paddingBottom: S.padYHeader }}>
            #
          </div>
          <div style={{ paddingLeft: S.padX, paddingRight: S.padX, paddingTop: S.padYHeader, paddingBottom: S.padYHeader }}>
            Type
          </div>
          <div className="text-right" style={{ paddingLeft: S.padX, paddingRight: S.padX, paddingTop: S.padYHeader, paddingBottom: S.padYHeader }}>
            Date / time
          </div>
          <div className="text-right" style={{ paddingLeft: S.padX, paddingRight: S.padX, paddingTop: S.padYHeader, paddingBottom: S.padYHeader }}>
            Price
          </div>
          <div className="text-right" style={{ paddingLeft: S.padX, paddingRight: S.padX, paddingTop: S.padYHeader, paddingBottom: S.padYHeader }}>
            Position Size
          </div>
          <div className="text-right" style={{ paddingLeft: S.padX, paddingRight: S.padX, paddingTop: S.padYHeader, paddingBottom: S.padYHeader }}>
            Net P&L
          </div>
          <div className="text-right" style={{ paddingLeft: S.padX, paddingRight: S.padX, paddingTop: S.padYHeader, paddingBottom: S.padYHeader }}>
            Return
          </div>
        </div>

        {/* Scrollable Body */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto"
          style={{ minWidth: 'max-content' }}
        >
          {pairs.map(({ tradeNumber, type, entry, exit }, idx) => {
            const pnl = exit.tradePnlUsd;
            const isWin = pnl > 0;
            const isLoss = pnl < 0;
            const pnlColor = isWin ? POSITIVE : isLoss ? NEGATIVE : '#9ca3af';
            const returnPct =
              entry.positionSizeUsd > 0
                ? (pnl / entry.positionSizeUsd) * 100
                : 0;
            const sideColor = type === 'Long' ? POSITIVE : NEGATIVE;
            const showBottomBorder = idx !== pairs.length - 1;

            const rowMinHeight = `calc(${F.body} * 1.5 + ${S.padYRow} * 2)`;

            const cellStyle: CSSProperties = {
              paddingLeft: S.padX,
              paddingRight: S.padX,
              paddingTop: S.padYRow,
              paddingBottom: S.padYRow,
              minHeight: rowMinHeight,
              boxSizing: 'border-box',
            };

            return (
              <div
                key={tradeNumber}
                onClick={() => {
                  if (entry.rawTime) onSelectTrade?.(entry.rawTime);
                }}
                className={`relative grid items-start hover:bg-blue-50/40 dark:hover:bg-gray-700/40 cursor-pointer ${
                  showBottomBorder ? 'border-b border-gray-200 dark:border-gray-700' : ''
                }`}
                style={{ gridTemplateColumns: COL_TEMPLATE, columnGap: S.colGap }}
              >
                {/* Trade # + side — spans both rows. */}
                <div
                  className="row-span-2 flex items-center justify-between gap-2 self-stretch"
                  style={{
                    gridRow: 'span 2 / span 2',
                    ...cellStyle,
                  }}
                >
                  <span
                    className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums"
                    style={{ fontSize: F.body }}
                  >
                    {tradeNumber}
                  </span>
                  <span
                    className="font-medium lowercase tracking-tight"
                    style={{ color: sideColor, fontSize: F.side }}
                  >
                    {type === 'Long' ? 'long' : 'short'}
                  </span>
                </div>

                {/* Exit row (top) */}
                <div className="flex items-center" style={cellStyle}>
                  <span
                    className="inline-flex items-center justify-center px-2 py-0.5 rounded font-semibold text-gray-800 dark:text-gray-200"
                    style={{ minWidth: '56px', fontSize: F.side }}
                  >
                    Exit
                  </span>
                </div>
                <div
                  className="flex items-center justify-end tabular-nums whitespace-nowrap text-gray-700 dark:text-gray-300"
                  style={{ ...cellStyle, fontSize: F.body }}
                >
                  {exit.date}
                </div>
                <div
                  className="flex items-baseline justify-end gap-1 tabular-nums"
                  style={cellStyle}
                >
                  <span className="text-gray-800 dark:text-gray-200 font-medium" style={{ fontSize: F.body }}>
                    {fmtMoney(exit.price)}
                  </span>
                  <span
                    className="text-gray-400 font-medium"
                    style={{ fontSize: F.currency }}
                  >
                    USD
                  </span>
                </div>
                <div
                  className="flex flex-col items-end justify-center leading-tight tabular-nums"
                  style={cellStyle}
                >
                  <span
                    className="font-semibold text-gray-800 dark:text-gray-200"
                    style={{ fontSize: F.body }}
                  >
                    {fmtSize(exit.positionSizeUsd)}
                  </span>
                  <span
                    className="text-gray-400 font-medium uppercase tracking-wider"
                    style={{ fontSize: F.sizeSuffix }}
                  >
                    USD
                  </span>
                </div>
                <div
                  className="flex items-center justify-end gap-1 tabular-nums"
                  style={{ ...cellStyle, color: pnlColor }}
                >
                  <span
                    className="font-bold leading-none"
                    style={{ fontSize: F.body }}
                  >
                    {isWin ? '+' : isLoss ? '−' : ''}
                    {fmtMoney(Math.abs(pnl))}
                  </span>
                  <span
                    className="font-medium opacity-70 leading-none"
                    style={{ fontSize: F.pnlUsd }}
                  >
                    USD
                  </span>
                </div>
                <div
                  className="flex items-center justify-end tabular-nums font-bold leading-none"
                  style={{ ...cellStyle, color: pnlColor, fontSize: F.body }}
                >
                  {fmtPctSigned(returnPct)}
                </div>

                {/* Divider between Exit and Entry — spans columns 2 (Type) to 5 (Position Size). */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none border-t border-gray-150 dark:border-gray-750"
                  style={{
                    top: '50%',
                    gridColumn: '2 / 6',
                    left: 0,
                    right: 0,
                  }}
                />

                {/* Entry row (bottom) */}
                <div className="flex items-center" style={cellStyle}>
                  <span
                    className="inline-flex items-center justify-center px-2 py-0.5 rounded font-semibold text-gray-800 dark:text-gray-200"
                    style={{ minWidth: '56px', fontSize: F.side }}
                  >
                    Entry
                  </span>
                </div>
                <div
                  className="flex items-center justify-end tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-400"
                  style={{ ...cellStyle, fontSize: F.body }}
                >
                  {entry.date}
                </div>
                <div
                  className="flex items-baseline justify-end gap-1 tabular-nums"
                  style={cellStyle}
                >
                  <span className="text-gray-800 dark:text-gray-200 font-medium" style={{ fontSize: F.body }}>
                    {fmtMoney(entry.price)}
                  </span>
                  <span
                    className="text-gray-400 font-medium"
                    style={{ fontSize: F.currency }}
                  >
                    USD
                  </span>
                </div>
                <div
                  className="flex flex-col items-end justify-center leading-tight tabular-nums"
                  style={cellStyle}
                >
                  <span
                    className="font-semibold text-gray-800 dark:text-gray-200"
                    style={{ fontSize: F.body }}
                  >
                    {fmtSize(entry.positionSizeUsd)}
                  </span>
                  <span
                    className="text-gray-400 font-medium uppercase tracking-wider"
                    style={{ fontSize: F.sizeSuffix }}
                  >
                    USD
                  </span>
                </div>
                <div style={cellStyle} />
                <div style={cellStyle} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
