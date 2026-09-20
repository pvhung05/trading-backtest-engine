import { useEffect, useMemo, useRef, type CSSProperties } from 'react';

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

// Fluid proportional column template that seamlessly resizes at 60 FPS
const COL_TEMPLATE =
  'minmax(85px, 1fr) ' +
  'minmax(65px, 0.75fr) ' +
  'minmax(140px, 1.5fr) ' +
  'minmax(110px, 1.2fr) ' +
  'minmax(110px, 1.2fr) ' +
  'minmax(125px, 1.3fr) ' +
  'minmax(85px, 0.95fr)';

const STYLES = {
  fontBody: '13px',
  fontHeader: '12px',
  fontCurrency: '10px',
  fontSizeSuffix: '9px',
  fontSide: '12px',
  fontPnlUsd: '10px',
  colGap: '16px',
  padX: '16px',
  padYRow: '7px',
  padYHeader: '9px',
  minWidth: '760px',
};

export function TradeHistoryTable({ trades, onSelectTrade }: TradeHistoryTableProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const rowMinHeight = `calc(${STYLES.fontBody} * 1.5 + ${STYLES.padYRow} * 2)`;

  const cellStyle: CSSProperties = {
    paddingLeft: STYLES.padX,
    paddingRight: STYLES.padX,
    paddingTop: STYLES.padYRow,
    paddingBottom: STYLES.padYRow,
    minHeight: rowMinHeight,
    boxSizing: 'border-box',
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
          className="sticky top-0 z-10 grid items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-850/90 backdrop-blur-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0 w-full"
          style={{
            gridTemplateColumns: COL_TEMPLATE,
            columnGap: STYLES.colGap,
            fontSize: STYLES.fontHeader,
            minWidth: STYLES.minWidth,
          }}
        >
          <div style={{ paddingLeft: STYLES.padX, paddingRight: STYLES.padX, paddingTop: STYLES.padYHeader, paddingBottom: STYLES.padYHeader }}>
            #
          </div>
          <div style={{ paddingLeft: STYLES.padX, paddingRight: STYLES.padX, paddingTop: STYLES.padYHeader, paddingBottom: STYLES.padYHeader }}>
            Type
          </div>
          <div className="text-right" style={{ paddingLeft: STYLES.padX, paddingRight: STYLES.padX, paddingTop: STYLES.padYHeader, paddingBottom: STYLES.padYHeader }}>
            Date / time
          </div>
          <div className="text-right" style={{ paddingLeft: STYLES.padX, paddingRight: STYLES.padX, paddingTop: STYLES.padYHeader, paddingBottom: STYLES.padYHeader }}>
            Price
          </div>
          <div className="text-right" style={{ paddingLeft: STYLES.padX, paddingRight: STYLES.padX, paddingTop: STYLES.padYHeader, paddingBottom: STYLES.padYHeader }}>
            Position Size
          </div>
          <div className="text-right" style={{ paddingLeft: STYLES.padX, paddingRight: STYLES.padX, paddingTop: STYLES.padYHeader, paddingBottom: STYLES.padYHeader }}>
            Net P&L
          </div>
          <div className="text-right" style={{ paddingLeft: STYLES.padX, paddingRight: STYLES.padX, paddingTop: STYLES.padYHeader, paddingBottom: STYLES.padYHeader }}>
            Return
          </div>
        </div>

        {/* Scrollable Body */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto w-full"
          style={{ minWidth: STYLES.minWidth }}
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

            return (
              <div
                key={tradeNumber}
                onClick={() => {
                  if (entry.rawTime) onSelectTrade?.(entry.rawTime);
                }}
                className={`relative grid items-start hover:bg-blue-50/40 dark:hover:bg-gray-700/40 cursor-pointer ${
                  showBottomBorder ? 'border-b border-gray-200 dark:border-gray-700' : ''
                }`}
                style={{
                  gridTemplateColumns: COL_TEMPLATE,
                  columnGap: STYLES.colGap,
                }}
              >
                {/* Trade # + side — spans both rows. */}
                <div
                  className="row-span-2 flex items-center justify-between gap-1.5 self-stretch"
                  style={{
                    gridRow: 'span 2 / span 2',
                    ...cellStyle,
                  }}
                >
                  <span
                    className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums"
                    style={{ fontSize: STYLES.fontBody }}
                  >
                    {tradeNumber}
                  </span>
                  <span
                    className="font-medium lowercase tracking-tight px-1 py-0.2 rounded text-[11px]"
                    style={{
                      color: sideColor,
                      backgroundColor: type === 'Long' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(217, 74, 74, 0.1)',
                      fontSize: STYLES.fontSide,
                    }}
                  >
                    {type === 'Long' ? 'long' : 'short'}
                  </span>
                </div>

                {/* Exit row (top) */}
                <div className="flex items-center" style={cellStyle}>
                  <span
                    className="inline-flex items-center justify-center px-1.5 py-0.2 rounded font-semibold text-gray-700 dark:text-gray-200 text-[11px]"
                    style={{ minWidth: '48px', fontSize: STYLES.fontSide }}
                  >
                    Exit
                  </span>
                </div>
                <div
                  className="flex items-center justify-end tabular-nums whitespace-nowrap text-gray-700 dark:text-gray-300"
                  style={{ ...cellStyle, fontSize: STYLES.fontBody }}
                >
                  {exit.date}
                </div>
                <div
                  className="flex items-baseline justify-end gap-1 tabular-nums"
                  style={cellStyle}
                >
                  <span className="text-gray-800 dark:text-gray-200 font-medium" style={{ fontSize: STYLES.fontBody }}>
                    {fmtMoney(exit.price)}
                  </span>
                  <span
                    className="text-gray-400 font-medium"
                    style={{ fontSize: STYLES.fontCurrency }}
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
                    style={{ fontSize: STYLES.fontBody }}
                  >
                    {fmtSize(exit.positionSizeUsd)}
                  </span>
                  <span
                    className="text-gray-400 font-medium uppercase tracking-wider"
                    style={{ fontSize: STYLES.fontSizeSuffix }}
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
                    style={{ fontSize: STYLES.fontBody }}
                  >
                    {isWin ? '+' : isLoss ? '−' : ''}
                    {fmtMoney(Math.abs(pnl))}
                  </span>
                  <span
                    className="font-medium opacity-70 leading-none"
                    style={{ fontSize: STYLES.fontPnlUsd }}
                  >
                    USD
                  </span>
                </div>
                <div
                  className="flex items-center justify-end tabular-nums font-bold leading-none"
                  style={{ ...cellStyle, color: pnlColor, fontSize: STYLES.fontBody }}
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
                    className="inline-flex items-center justify-center px-1.5 py-0.2 rounded font-semibold text-gray-700 dark:text-gray-200 text-[11px]"
                    style={{ minWidth: '48px', fontSize: STYLES.fontSide }}
                  >
                    Entry
                  </span>
                </div>
                <div
                  className="flex items-center justify-end tabular-nums whitespace-nowrap text-gray-500 dark:text-gray-400"
                  style={{ ...cellStyle, fontSize: STYLES.fontBody }}
                >
                  {entry.date}
                </div>
                <div
                  className="flex items-baseline justify-end gap-1 tabular-nums"
                  style={cellStyle}
                >
                  <span className="text-gray-800 dark:text-gray-200 font-medium" style={{ fontSize: STYLES.fontBody }}>
                    {fmtMoney(entry.price)}
                  </span>
                  <span
                    className="text-gray-400 font-medium"
                    style={{ fontSize: STYLES.fontCurrency }}
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
                    style={{ fontSize: STYLES.fontBody }}
                  >
                    {fmtSize(entry.positionSizeUsd)}
                  </span>
                  <span
                    className="text-gray-400 font-medium uppercase tracking-wider"
                    style={{ fontSize: STYLES.fontSizeSuffix }}
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
