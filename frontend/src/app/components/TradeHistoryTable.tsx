import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

type Scale = 'comfortable' | 'compact' | 'tight';

/**
 * Map panel width → scale tier. We use a tiny piece of hysteresis so that
 * dragging the watchlist slowly across a threshold doesn't make the table
 * snap up/down by a full tier on each frame. The rules:
 *   - moving DOWN (panel getting smaller) uses the *lower* threshold, so
 *     we commit to the tighter tier a bit earlier and stay there.
 *   - moving UP (panel getting larger) uses the *higher* threshold, so
 *     we wait for some headroom before relaxing back to comfortable.
 * The width passed in is the panel's inner width *after* the scrollbar
 * gutter is subtracted (see `useScale`).
 */
function pickScale(width: number, current: Scale): Scale {
  // Same down/up boundary when we're already in `tight` (no hysteresis
  // needed past the smallest tier).
  if (current === 'comfortable' && width < 1140) return 'compact';
  if (current === 'compact' && width >= 1140) return 'comfortable';
  if (current === 'compact' && width < 780) return 'tight';
  if (current === 'tight' && width >= 820) return 'compact';
  // Initial pick — no current tier yet.
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

export function TradeHistoryTable({ trades }: TradeHistoryTableProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Latest committed scale tier, kept in a ref so the ResizeObserver
  // closure can read it without re-subscribing on every state change.
  // The hysteresis logic in `pickScale` depends on this staying fresh.
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
    // Sort trade numbers so the *newest* trade (largest #) shows up at
    // the top of the table, matching the TradingView Strategy Tester
    // layout where the most recent trade is the first row you see.
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

// Watch the actual width of the table *panel* and recompute the
// responsive scale tier. We observe `rootRef` (the panel itself) rather
// than the scroll body because the body has `min-width: max-content`
// applied to its rows — that makes the body report a content-driven
// width that doesn't reflect the available horizontal space when the
// columns overflow. The panel's width is the truth source for layout
// decisions because that's what the App-level resizer controls.
//
// We also subtract the scrollbar gutter (~6px under our app-scrollbar
// overlay rules) so the scale tier doesn't lag behind the visible width.
//
// Each callback reads the *current* `scale` value out of a ref so that
// the hysteresis in `pickScale` works across updates, and we skip the
// setState when the tier hasn't actually changed — that's what was
// causing the table to thrash on every micro-resize.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;

    const SCROLLBAR_GUTTER = 6;
    // Hysteresis needs the *latest* committed tier, but the RO callback
    // can't depend on `scale` directly without re-subscribing on every
    // render. The `scaleRef` (kept in sync by the effect below) gives the
    // closure a fresh read on every callback, so we only setState when the
    // tier actually flips — no per-frame render thrash.
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const inner = Math.max(0, entry.contentRect.width - SCROLLBAR_GUTTER);
        const next = pickScale(inner, scaleRef.current);
        if (next !== scaleRef.current) {
          scaleRef.current = next;
          setScale(next);
        }
      }
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // Keep the ref the RO closure reads in sync with the latest committed
  // tier. Without this, the hysteresis in `pickScale` would always be
  // computed against the value the effect captured at mount time.
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  if (pairs.length === 0) {
    return (
      <div
        ref={rootRef}
        className="flex-1 min-h-0 flex items-center justify-center px-4 py-8 bg-white dark:bg-gray-800 font-sans"
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

  // 7 columns matching the TradingView Strategy Tester screenshot:
  //   # | Type | Date / time | Price | Size | Net PnL | Return
  // The first column hosts the trade number + side and `row-span: 2`,
  // so the Entry / Exit rows begin at column 2 automatically.
  //
  // Each scale tier shrinks the `min` track so columns can hug the content
  // when the panel narrows. We intentionally use `max-content` (not a fr
  // unit) on the upper bound — the columns should NOT expand to fill extra
  // width when the watchlist is collapsed. The table only ever grows along
  // its vertical axis (one row per trade); horizontal scroll is the
  // overflow mechanism when the panel can't fit the natural column width.
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

  // Locked font sizes — independent of `scale`. Picked once so the table
  // looks identical at every panel width. Vertical padding/gap still flows
  // from `S` so the table breathes with the panel.
  const F = {
    body: '14px',
    header: '13px',
    currency: '11px',
    sizeSuffix: '10px',
    side: '13px',
    pnlUsd: '11px',
  };

  return (
    <div
      ref={rootRef}
      className="flex-1 min-h-0 flex flex-col bg-white dark:bg-gray-800 overflow-hidden font-sans text-gray-800 dark:text-gray-200"
    >
      <div className="shrink-0 sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)]">
        <div
          className="grid items-center font-medium text-gray-500 dark:text-gray-400 tracking-tight transition-[padding,column-gap,font-size] duration-150 ease-out"
          style={{
            gridTemplateColumns: COL_TEMPLATE,
            columnGap: S.colGap,
            fontSize: '13px',
            paddingLeft: '5px',
            paddingRight: S.padX,
            paddingTop: S.padYHeader,
            paddingBottom: S.padYHeader,
            minWidth: 'max-content',
          }}
        >
          <div className="flex justify-start" style={{ marginLeft: '+5px' }}>Trade number</div>
          <div className="flex justify-start" style={{ marginLeft: '+20px' }}>Type</div>
          <div className="flex justify-end">Date and time</div>
          <div className="flex justify-end">Price</div>
          <div className="flex justify-end">Size</div>
          <div className="flex justify-end">Net PnL</div>
          <div className="flex justify-end">Return</div>
        </div>
      </div>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-auto app-scrollbar-overlay">
        <div
          className="text-gray-800 dark:text-gray-200 tracking-tight"
          style={{ minWidth: 'max-content' }}
        >
          {pairs.map((pair, idx) => {
            const { entry, exit, type, tradeNumber } = pair;
            const pnl = exit.tradePnlUsd;
            const isWin = pnl > 0;
            const isLoss = pnl < 0;
            const pnlColor = isWin ? POSITIVE : isLoss ? NEGATIVE : '#374151';
            const returnPct =
              entry.positionSizeUsd > 0
                ? (pnl / entry.positionSizeUsd) * 100
                : 0;
            const sideColor = type === 'Long' ? POSITIVE : NEGATIVE;
            const showBottomBorder = idx !== pairs.length - 1;

            // Lock the height of a single row so that the row-span-2 cells
            // (Trade #, Net PnL, Return) line up vertically with each
            // other. Without an explicit height, the Exit and Entry rows
            // can drift apart (e.g. the Size cell wraps "USD" onto a
            // second line, making its row taller than the Date row), which
            // shifts the midpoint of PnL/Return away from the midpoint of
            // the trade number. We size each row to comfortably fit one
            // line of body text plus the row padding.
            const rowMinHeight = `calc(${F.body} * 1.5 + ${S.padYRow} * 2)`;

            // Cell-level padding & font: every cell uses the same `px`
            // and row vertical padding so columns line up across header
            // and body, and the table scales down uniformly.
            const cellStyle: CSSProperties = {
              paddingLeft: S.padX,
              paddingRight: S.padX,
              paddingTop: S.padYRow,
              paddingBottom: S.padYRow,
              transition: 'padding 150ms ease-out',
              minHeight: rowMinHeight,
              boxSizing: 'border-box',
            };

            return (
              <div
                key={tradeNumber}
                className={`relative grid items-start transition-[column-gap] duration-150 ease-out ${
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
                  className="flex items-center justify-end tabular-nums whitespace-nowrap"
                  style={{ ...cellStyle, fontSize: F.body }}
                >
                  {exit.date}
                </div>
                <div
                  className="flex items-baseline justify-end gap-1 tabular-nums"
                  style={cellStyle}
                >
                  <span className="text-gray-800 dark:text-gray-200" style={{ fontSize: F.body }}>
                    {fmtMoney(exit.price)}
                  </span>
                  <span
                    className="text-gray-400 dark:text-gray-500 font-medium"
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
                    className="text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider"
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
                    className="font-semibold leading-none"
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
                  className="flex items-center justify-end tabular-nums font-semibold leading-none"
                  style={{ ...cellStyle, color: pnlColor, fontSize: F.body }}
                >
                  {fmtPctSigned(returnPct)}
                </div>

                {/* Divider between Exit and Entry — spans columns 2 (Type) to 5 (Size). */}
                <div
                  aria-hidden
                  className="absolute pointer-events-none border-t border-gray-200 dark:border-gray-700"
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
                  className="flex items-center justify-end tabular-nums whitespace-nowrap"
                  style={{ ...cellStyle, fontSize: F.body }}
                >
                  {entry.date}
                </div>
                <div
                  className="flex items-baseline justify-end gap-1 tabular-nums"
                  style={cellStyle}
                >
                  <span className="text-gray-800 dark:text-gray-200" style={{ fontSize: F.body }}>
                    {fmtMoney(entry.price)}
                  </span>
                  <span
                    className="text-gray-400 dark:text-gray-500 font-medium"
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
                    className="text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider"
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
