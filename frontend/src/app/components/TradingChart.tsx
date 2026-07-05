import { useEffect, useMemo, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import { useOHLCV } from './OHLCVContext';
import { BTC_USD_DAILY } from '../data/mockOHLCV';
import { MOCK_TRADES } from '../data/mockTrades';
import { SelectedIndicator, SelectedStrategy } from './Toolbar';
import { X, Eye, EyeOff, MoreHorizontal, ChevronUp, ChevronDown, Activity, BarChart2 } from 'lucide-react';

function formatNum(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatVolume(v: number) {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(2) + 'K';
  return v.toFixed(0);
}

interface CandleRow {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function buildCandles(rows: typeof BTC_USD_DAILY): CandleRow[] {
  return rows.map((row) => {
    const timeInSeconds = Math.floor(new Date(row.endTime).getTime() / 1000);
    return {
      time: timeInSeconds,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    };
  });
}

function formatTimeLabel(unixSeconds: number) {
  const d = new Date(unixSeconds * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}

interface OverlayRowProps {
  items: { name: string; badge?: 'NEW' | 'BETA' }[];
  hiddenSet?: Set<string>;
  collapsed: boolean;
  onToggleVisibility?: (name: string) => void;
  onRemove?: (name: string) => void;
  onToggleCollapse: () => void;
  groupLabel: string;
  icon: React.ReactNode;
}

function OverlayRow({
  items,
  hiddenSet,
  collapsed,
  onToggleVisibility,
  onRemove,
  onToggleCollapse,
  groupLabel,
  icon,
}: OverlayRowProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col items-start gap-0.5">
      {!collapsed &&
        items.map((item) => {
          const isHidden = hiddenSet?.has(item.name) ?? false;
          return (
            <div
              key={item.name}
              className="group inline-flex items-center gap-1.5 text-xs text-gray-800"
            >
              <span className={`font-medium ${isHidden ? 'opacity-40' : ''}`}>
                {item.name}
              </span>
              {onToggleVisibility && (
                <button
                  onClick={() => onToggleVisibility(item.name)}
                  className="text-gray-500 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={isHidden ? `Show ${item.name}` : `Hide ${item.name}`}
                >
                  {isHidden ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </button>
              )}
              <button
                className="text-gray-500 hover:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                title={`${item.name} settings`}
              >
                <MoreHorizontal className="size-3.5" />
              </button>
              {onRemove && (
                <button
                  onClick={() => onRemove(item.name)}
                  className="text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`Remove ${item.name}`}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}
      <button
        onClick={onToggleCollapse}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mt-0.5"
        title={collapsed ? `Show ${groupLabel}` : `Hide ${groupLabel}`}
      >
        <span className="opacity-60">{icon}</span>
        <span>
          {collapsed ? `${groupLabel} (${items.length})` : `Hide ${groupLabel}`}
        </span>
        {collapsed ? (
          <ChevronDown className="size-3.5 ml-0.5" />
        ) : (
          <ChevronUp className="size-3.5 ml-0.5" />
        )}
      </button>
    </div>
  );
}

export function TradingChart({
  selectedIndicators = [],
  hiddenIndicators,
  onToggleIndicatorVisibility,
  onRemoveIndicator,
  allIndicatorsHidden,
  onToggleAllIndicators,
  selectedStrategies = [],
  hiddenStrategies,
  onToggleStrategyVisibility,
  onRemoveStrategy,
  allStrategiesHidden,
  onToggleAllStrategies,
}: {
  selectedIndicators?: SelectedIndicator[];
  hiddenIndicators?: Set<string>;
  onToggleIndicatorVisibility?: (name: string) => void;
  onRemoveIndicator?: (name: string) => void;
  allIndicatorsHidden?: boolean;
  onToggleAllIndicators?: () => void;
  selectedStrategies?: SelectedStrategy[];
  hiddenStrategies?: Set<string>;
  onToggleStrategyVisibility?: (name: string) => void;
  onRemoveStrategy?: (name: string) => void;
  allStrategiesHidden?: boolean;
  onToggleAllStrategies?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candleSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']> | null>(null);
  const volumeSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addHistogramSeries']> | null>(null);
  // Indicator + trade-marker series. Each is added once the chart is
  // ready and removed together with the chart in the cleanup function.
  const smaSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addLineSeries']> | null>(null);
  const markersRef = useRef<ReturnType<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']>['setMarkers']> | null>(null);
  const { setData } = useOHLCV();

  const [crosshair, setCrosshair] = useState<{
    x: number;
    y: number;
    price: number | null;
    time: number | null;
  } | null>(null);

  const candles = useMemo(() => buildCandles(BTC_USD_DAILY), []);

  // Simple Moving Average (period = 20). The first `period-1` points are
  // undefined to mirror how most charting platforms render the warmup.
  const SMA_PERIOD = 20;
  const smaData = useMemo(() => {
    const out: { time: number; value: number }[] = [];
    let sum = 0;
    for (let i = 0; i < candles.length; i++) {
      sum += candles[i].close;
      if (i >= SMA_PERIOD) sum -= candles[i - SMA_PERIOD].close;
      if (i >= SMA_PERIOD - 1) {
        out.push({ time: candles[i].time, value: sum / SMA_PERIOD });
      }
    }
    return out;
  }, [candles]);

  // Translate mock trades into lightweight-charts markers. Long entries
  // are green up arrows, long exits are red down arrows (and vice versa
  // for shorts) so the trade direction is obvious at a glance.
  const tradeMarkers = useMemo(
    () =>
      MOCK_TRADES.flatMap((t) => [
        {
          time: t.entryTime,
          position: 'belowBar' as const,
          color: '#22c55e',
          shape: 'arrowUp' as const,
          text: t.side === 'long' ? 'Long' : 'Short',
        },
        {
          time: t.exitTime,
          position: 'aboveBar' as const,
          color: '#ef4444',
          shape: 'arrowDown' as const,
          text: `PnL ${t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(0)}`,
        },
      ]).sort((a, b) => a.time - b.time),
    []
  );

  useEffect(() => {

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
        // Hide the small "TradingView" attribution watermark that
        // lightweight-charts paints in the bottom-left corner. We're
        // already running our own UI; the watermark adds visual noise.
        watermark: { visible: false },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: CrosshairMode.Hidden,
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: false,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });

    const candleData = candles.map(({ time, open, high, low, close }) => ({
      time,
      open,
      high,
      low,
      close,
    }));

    const volumeData = candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(38, 166, 154, 0.55)' : 'rgba(239, 83, 80, 0.55)',
    }));

    candlestickSeries.setData(candleData);
    volumeSeries.setData(volumeData);

    candleSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // ── Indicators: SMA 20 ─────────────────────────────────────────
    // Drawn directly here (rather than in a separate effect) so it is
    // guaranteed to run after the candlestick series is registered.
    const smaSeries = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      title: `SMA ${SMA_PERIOD}`,
    });
    smaSeries.setData(smaData);
    smaSeriesRef.current = smaSeries;

    // ── Trade markers: entry (green up arrow) + exit (red down arrow)
    // Markers must be set on a series that already has data; the candle
    // series qualifies. Sorted by time so lightweight-charts accepts
    // them in ascending order.
    candlestickSeries.setMarkers(tradeMarkers);
    markersRef.current = candlestickSeries.setMarkers.bind(candlestickSeries);

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const first = candles[0];
    const change = last.close - prev.close;
    const changePct = (change / prev.close) * 100;
    const periodChange = last.close - first.open;
    const periodChangePct = (periodChange / first.open) * 100;

    setData({
      time: formatTimeLabel(last.time),
      open: formatNum(last.open),
      high: formatNum(last.high),
      low: formatNum(last.low),
      close: formatNum(last.close),
      change: (change >= 0 ? '+' : '') + formatNum(change),
      changePct: (changePct >= 0 ? '+' : '') + formatNum(changePct) + '%',
      volume: formatVolume(last.volume),
      bid: formatNum(last.close - 12.5),
      ask: formatNum(last.close + 12.5),
      periodChange: (periodChange >= 0 ? '+' : '') + formatNum(periodChange),
      periodChangePct: (periodChangePct >= 0 ? '+' : '') + formatNum(periodChangePct) + '%',
    });

    chart.timeScale().fitContent();

    chart.subscribeCrosshairMove((param) => {
      const x = param.point?.x;
      const y = param.point?.y;

      if (param.time && x !== undefined && y !== undefined) {
        const candle = param.seriesData.get(candlestickSeries) as
          | { open: number; high: number; low: number; close: number }
          | undefined;

        const vol = param.seriesData.get(volumeSeries) as { value: number } | undefined;

        const timeValue = Number(param.time);

        setCrosshair({
          x,
          y,
          price: candle?.close ?? null,
          time: timeValue,
        });

        if (candle) {
          const chg = candle.close - prev.close;
          const chgPct = (chg / prev.close) * 100;
          const periodChg = candle.close - first.open;
          const periodChgPct = (periodChg / first.open) * 100;

          setData({
            time: formatTimeLabel(timeValue),
            open: formatNum(candle.open),
            high: formatNum(candle.high),
            low: formatNum(candle.low),
            close: formatNum(candle.close),
            change: (chg >= 0 ? '+' : '') + formatNum(chg),
            changePct: (chgPct >= 0 ? '+' : '') + formatNum(chgPct) + '%',
            volume: vol ? formatVolume(vol.value) : '—',
            bid: formatNum(candle.close - 12.5),
            ask: formatNum(candle.close + 12.5),
            periodChange: (periodChg >= 0 ? '+' : '') + formatNum(periodChg),
            periodChangePct: (periodChgPct >= 0 ? '+' : '') + formatNum(periodChgPct) + '%',
          });
        }
      } else {
        setCrosshair(null);
      }
    });

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles, setData, smaData, tradeMarkers]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {crosshair && crosshair.price !== null && crosshair.time !== null && (
        <>
          {/* Vertical crosshair line */}
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: crosshair.x,
              top: 0,
              bottom: 0,
              width: 1,
              background: '#9ca3af',
              transform: 'translateX(-0.5px)',
            }}
          />
          {/* Horizontal crosshair line */}
          <div
            className="absolute pointer-events-none z-10"
            style={{
              top: crosshair.y,
              left: 0,
              right: 0,
              height: 1,
              background: '#9ca3af',
              transform: 'translateY(-0.5px)',
            }}
          />
          {/* Price axis label (right side, vertically aligned with cursor Y) */}
          <div
            className="absolute pointer-events-none z-20 font-medium px-1.5 py-0.5 bg-blue-600 text-white rounded shadow-sm tabular-nums whitespace-nowrap"
            style={{
              fontSize: '11px',
              lineHeight: 1.2,
              left: '100%',
              top: crosshair.y,
              transform: 'translate(-100%, -50%)',
            }}
          >
            {formatNum(crosshair.price)}
          </div>
          {/* Time axis label (bottom, horizontally aligned with cursor X) */}
          <div
            className="absolute pointer-events-none z-20 font-medium px-1.5 py-0.5 bg-blue-600 text-white rounded shadow-sm whitespace-nowrap"
            style={{
              fontSize: '11px',
              lineHeight: 1.2,
              top: '100%',
              left: crosshair.x,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {formatTimeLabel(crosshair.time)}
          </div>
        </>
      )}

      {(selectedIndicators.length > 0 || selectedStrategies.length > 0) && (
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-2">
          <OverlayRow
            items={selectedIndicators}
            hiddenSet={hiddenIndicators}
            collapsed={!!allIndicatorsHidden}
            onToggleVisibility={onToggleIndicatorVisibility}
            onRemove={onRemoveIndicator}
            onToggleCollapse={onToggleAllIndicators ?? (() => {})}
            groupLabel="Indicators"
            icon={<BarChart2 className="size-3.5" />}
          />
          <OverlayRow
            items={selectedStrategies}
            hiddenSet={hiddenStrategies}
            collapsed={!!allStrategiesHidden}
            onToggleVisibility={onToggleStrategyVisibility}
            onRemove={onRemoveStrategy}
            onToggleCollapse={onToggleAllStrategies ?? (() => {})}
            groupLabel="Strategies"
            icon={<Activity className="size-3.5" />}
          />
        </div>
      )}
    </div>
  );
}
