import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle, ISeriesApi, SeriesMarker, Time, LogicalRange } from 'lightweight-charts';
import { useOHLCV } from './OHLCVContext';
import { marketApi, KlineResponse } from '../services/marketApi';
import { websocketService, RealtimeKline } from '../services/websocketService';
import { SelectedIndicator, SelectedStrategy } from './Toolbar';
import { useTheme } from './ThemeContext';
import { BTC_USD_DAILY } from '../data/mockOHLCV';
import { X, Eye, EyeOff, MoreHorizontal, ChevronUp, ChevronDown, Activity, BarChart2, Loader2 } from 'lucide-react';

type ThemeName = 'light' | 'dark';

interface ChartTheme {
  background: string;
  textColor: string;
  grid: string;
  border: string;
  crosshairLine: string;
}

const CHART_THEMES: Record<ThemeName, ChartTheme> = {
  light: {
    background: '#ffffff',
    textColor: '#333333',
    grid: '#f0f0f0',
    border: '#e0e0e0',
    crosshairLine: '#9ca3af',
  },
  dark: {
    background: '#1f2937', // gray-800
    textColor: '#d1d5db', // gray-300
    grid: '#374151', // gray-700
    border: '#374151', // gray-700
    crosshairLine: '#6b7280', // gray-500
  },
};

function formatNum(n: number | undefined | null, decimals = 2): string {
  if (n === undefined || n === null || isNaN(n)) return '—';
  if (Math.abs(n) < 0.0001 && n !== 0) return n.toFixed(6);
  if (Math.abs(n) < 1) return n.toFixed(4);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatVolume(v: number | undefined | null): string {
  if (v === undefined || v === null || isNaN(v)) return '—';
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(2) + 'K';
  return v.toFixed(2);
}

interface CandleRow {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function buildFallbackCandles(): CandleRow[] {
  return BTC_USD_DAILY.map((row) => ({
    time: Math.floor(new Date(row.endTime).getTime() / 1000),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }));
}

function parseKlines(rawList: KlineResponse[]): CandleRow[] {
  return rawList
    .map((k) => {
      const timeInSec = Math.floor((k.openTime || k.closeTime || Date.now()) / 1000);
      return {
        time: timeInSec,
        open: parseFloat(k.open || '0'),
        high: parseFloat(k.high || '0'),
        low: parseFloat(k.low || '0'),
        close: parseFloat(k.close || '0'),
        volume: parseFloat(k.volume || '0'),
      };
    })
    .filter((c) => !isNaN(c.time) && c.time > 0)
    .sort((a, b) => a.time - b.time);
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
    <div className="flex flex-col items-start gap-0.5 bg-white/80 dark:bg-gray-850/80 backdrop-blur-xs p-1.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
      {!collapsed &&
        items.map((item) => {
          const isHidden = hiddenSet?.has(item.name) ?? false;
          return (
            <div
              key={item.name}
              className="group inline-flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200"
            >
              <span className={`font-medium ${isHidden ? 'opacity-40' : ''}`}>
                {item.name}
              </span>
              {onToggleVisibility && (
                <button
                  onClick={() => onToggleVisibility(item.name)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={isHidden ? `Show ${item.name}` : `Hide ${item.name}`}
                >
                  {isHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              )}
              <button
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                title={`${item.name} settings`}
              >
                <MoreHorizontal className="size-3.5" />
              </button>
              {onRemove && (
                <button
                  onClick={() => onRemove(item.name)}
                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
        className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 mt-0.5"
        title={collapsed ? `Show ${groupLabel}` : `Hide ${groupLabel}`}
      >
        <span className="opacity-60">{icon}</span>
        <span>{collapsed ? `${groupLabel} (${items.length})` : `Hide ${groupLabel}`}</span>
        {collapsed ? <ChevronDown className="size-3.5 ml-0.5" /> : <ChevronUp className="size-3.5 ml-0.5" />}
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
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const equitySeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [showEquityCurve, setShowEquityCurve] = useState(true);

  const { symbol, interval, setData, backtestResult, selectedTradeTime } = useOHLCV();
  const { isDark } = useTheme();
  const themeName: ThemeName = isDark ? 'dark' : 'light';
  const palette = CHART_THEMES[themeName];

  const [loadingKlines, setLoadingKlines] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // Always initialize with valid fallback candles to guarantee instantaneous rendering
  const [candles, setCandles] = useState<CandleRow[]>(() => buildFallbackCandles());
  const candlesRef = useRef<CandleRow[]>(candles);
  candlesRef.current = candles;

  const isLoadingOlderRef = useRef(false);
  const hasMoreOlderRef = useRef(true);
  const lastFetchTimeRef = useRef(0);

  const [crosshair, setCrosshair] = useState<{
    x: number;
    y: number;
    price: number | null;
    time: number | null;
  } | null>(null);

  // Helper to get duration of an interval in seconds
  const getIntervalSeconds = useCallback((intv: string): number => {
    const unit = intv.slice(-1);
    const val = parseInt(intv.slice(0, -1), 10) || 1;
    if (unit === 'm') return val * 60;
    if (unit === 'h') return val * 3600;
    if (unit === 'd') return val * 86400;
    if (unit === 'w') return val * 604800;
    if (unit === 'M') return val * 2592000;
    return 3600;
  }, []);

  // Helper to snap arbitrary epoch seconds to the closest matching candle timestamp within 1.5 bars
  const snapTimeToCandle = useCallback(
    (targetSec: number, candleList: CandleRow[], intv: string): number => {
      if (candleList.length === 0) return targetSec;
      const intervalSec = getIntervalSeconds(intv);
      const maxTolerance = intervalSec * 1.5;

      let low = 0;
      let high = candleList.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (candleList[mid].time === targetSec) return candleList[mid].time;
        if (candleList[mid].time < targetSec) low = mid + 1;
        else high = mid - 1;
      }
      const idx1 = Math.max(0, Math.min(candleList.length - 1, low));
      const idx2 = Math.max(0, Math.min(candleList.length - 1, high));
      const diff1 = Math.abs(candleList[idx1].time - targetSec);
      const diff2 = Math.abs(candleList[idx2].time - targetSec);
      const bestIdx = diff1 < diff2 ? idx1 : idx2;
      const minDiff = Math.min(diff1, diff2);

      // Only snap if candle is within tolerance, otherwise do not forcefully lump distant trades onto boundary candle
      if (minDiff <= maxTolerance) {
        return candleList[bestIdx].time;
      }
      return targetSec;
    },
    [getIntervalSeconds]
  );

  // 1. Fetch initial klines when symbol or interval changes
  useEffect(() => {
    let isCancelled = false;
    const cleanSymbol = symbol.replace('/', '').toUpperCase();
    hasMoreOlderRef.current = true;
    isLoadingOlderRef.current = false;

    const fetchKlines = async () => {
      setLoadingKlines(true);
      try {
        const raw = await marketApi.getKlines({
          symbol: cleanSymbol,
          interval,
          limit: 500,
        });

        if (!isCancelled && Array.isArray(raw) && raw.length > 0) {
          const parsed = parseKlines(raw);
          if (parsed.length > 0) {
            setCandles(parsed);
          }
        }
      } catch (err) {
        console.warn(`[TradingChart] Failed to fetch klines from API for ${cleanSymbol}:`, err);
      } finally {
        if (!isCancelled) {
          setLoadingKlines(false);
        }
      }
    };

    fetchKlines();

    return () => {
      isCancelled = true;
    };
  }, [symbol, interval]);

  // Automatically load ALL historical candles covering backtest range (multi-batch pagination)
  useEffect(() => {
    if (!backtestResult?.startTime || !backtestResult?.endTime) return;

    let isCancelled = false;
    const cleanSymbol = (backtestResult.symbol || symbol).replace('/', '').toUpperCase();
    const testInterval = backtestResult.timeframe || interval;
    const startMs = new Date(backtestResult.startTime).getTime();
    const endMs = new Date(backtestResult.endTime).getTime();

    if (isNaN(startMs) || isNaN(endMs)) return;

    const loadBacktestCandles = async () => {
      const current = candlesRef.current;
      const firstTimeMs = current.length > 0 ? current[0].time * 1000 : Infinity;
      const lastTimeMs = current.length > 0 ? current[current.length - 1].time * 1000 : -Infinity;

      // Check if current candles already cover the backtest period
      const isCovered = firstTimeMs <= startMs && lastTimeMs >= endMs;
      if (isCovered) {
        if (chartRef.current) {
          chartRef.current.timeScale().setVisibleRange({
            from: Math.floor(startMs / 1000) as Time,
            to: Math.floor(endMs / 1000) as Time,
          });
        }
        return;
      }

      setLoadingKlines(true);
      try {
        // Fetch historical data in chunks of up to 1000 bars until full backtest range is covered
        let curStart = startMs;
        const allFetched: KlineResponse[] = [];
        let iterations = 0;
        const maxIterations = 30; // Up to 30,000 candles safety limit

        while (curStart < endMs && iterations < maxIterations && !isCancelled) {
          iterations++;
          const raw = await marketApi.getKlines({
            symbol: cleanSymbol,
            interval: testInterval,
            startTime: curStart,
            endTime: endMs + 86400000,
            limit: 1000,
          });

          if (!Array.isArray(raw) || raw.length === 0) break;
          allFetched.push(...raw);

          const lastKline = raw[raw.length - 1];
          const lastOpen = lastKline.openTime || lastKline.closeTime;
          if (!lastOpen || lastOpen <= curStart) break;
          curStart = lastOpen + 1;

          if (raw.length < 1000) {
            break;
          }
        }

        if (!isCancelled && allFetched.length > 0) {
          const parsed = parseKlines(allFetched);
          if (parsed.length > 0) {
            const existingMap = new Map<number, CandleRow>();
            parsed.forEach((c) => existingMap.set(c.time, c));
            candlesRef.current.forEach((c) => existingMap.set(c.time, c));
            const merged = Array.from(existingMap.values()).sort((a, b) => a.time - b.time);
            setCandles(merged);

            setTimeout(() => {
              if (chartRef.current) {
                chartRef.current.timeScale().setVisibleRange({
                  from: Math.floor(startMs / 1000) as Time,
                  to: Math.floor(endMs / 1000) as Time,
                });
              }
            }, 50);
          }
        }
      } catch (err) {
        console.warn('[TradingChart] Failed to fetch backtest historical candles:', err);
      } finally {
        if (!isCancelled) {
          setLoadingKlines(false);
        }
      }
    };

    loadBacktestCandles();

    return () => {
      isCancelled = true;
    };
  }, [backtestResult, symbol, interval]);

  // 2. Lazy load older historical bars
  const fetchOlderKlines = useCallback(async () => {
    const now = Date.now();
    // Throttle to at most 1 request per 500ms
    if (now - lastFetchTimeRef.current < 500) return;
    if (isLoadingOlderRef.current || !hasMoreOlderRef.current || candlesRef.current.length === 0) {
      return;
    }

    const cleanSymbol = symbol.replace('/', '').toUpperCase();
    const earliest = candlesRef.current[0];
    if (!earliest || !earliest.time) return;

    isLoadingOlderRef.current = true;
    setLoadingOlder(true);
    lastFetchTimeRef.current = now;

    try {
      const olderRaw = await marketApi.getKlines({
        symbol: cleanSymbol,
        interval,
        limit: 300,
        endTime: earliest.time * 1000 - 1000,
      });

      if (!Array.isArray(olderRaw) || olderRaw.length === 0) {
        console.log('[LazyLoad] No more historical candles available from Binance.');
        hasMoreOlderRef.current = false;
        return;
      }

      const olderParsed = parseKlines(olderRaw);
      if (olderParsed.length === 0) {
        hasMoreOlderRef.current = false;
        return;
      }

      // Record current visible logical range before prepending new candles
      const currentRange = chartRef.current?.timeScale().getVisibleLogicalRange();

      // Merge and deduplicate by time
      const existingMap = new Map<number, CandleRow>();
      olderParsed.forEach((c) => existingMap.set(c.time, c));
      candlesRef.current.forEach((c) => existingMap.set(c.time, c));

      const merged = Array.from(existingMap.values()).sort((a, b) => a.time - b.time);
      const addedCount = merged.length - candlesRef.current.length;

      console.log(`[LazyLoad] Successfully loaded ${olderParsed.length} older bars (${addedCount} new bars added).`);

      setCandles(merged);

      // Compensate scroll position so the chart doesn't jump
      if (addedCount > 0 && currentRange && chartRef.current) {
        requestAnimationFrame(() => {
          chartRef.current?.timeScale().setVisibleLogicalRange({
            from: currentRange.from + addedCount,
            to: currentRange.to + addedCount,
          });
        });
      }
    } catch (err) {
      console.warn('[TradingChart] Lazy load older klines error:', err);
    } finally {
      isLoadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [symbol, interval]);

  const fetchOlderKlinesRef = useRef(fetchOlderKlines);
  fetchOlderKlinesRef.current = fetchOlderKlines;

  // 3. Compute SMA 20
  const SMA_PERIOD = 20;
  const smaData = useMemo(() => {
    const out: { time: Time; value: number }[] = [];
    let sum = 0;
    for (let i = 0; i < candles.length; i++) {
      sum += candles[i].close;
      if (i >= SMA_PERIOD) sum -= candles[i - SMA_PERIOD].close;
      if (i >= SMA_PERIOD - 1) {
        out.push({ time: candles[i].time as Time, value: sum / SMA_PERIOD });
      }
    }
    return out;
  }, [candles]);

  // 4. Convert Backtest Trades to Chart Markers
  const tradeMarkers = useMemo<SeriesMarker<Time>[]>(() => {
    if (!backtestResult?.trades || backtestResult.trades.length === 0 || candles.length === 0) {
      return [];
    }

    const testInterval = backtestResult.timeframe || interval;
    const markers: SeriesMarker<Time>[] = [];

    backtestResult.trades.forEach((t) => {
      if (!t.dateTime) return;
      const rawSec = Math.floor(new Date(t.dateTime).getTime() / 1000);
      if (isNaN(rawSec)) return;

      const timeSec = snapTimeToCandle(rawSec, candles, testInterval);

      const isEntry = t.type.toLowerCase().includes('entry');
      const isExit = t.type.toLowerCase().includes('exit');
      const isLong = t.tradeNumberWithSide.toLowerCase().includes('long');
      const parts = t.tradeNumberWithSide.split(' ');
      const tradeNum = parts[0] || '';

      if (isEntry) {
        markers.push({
          time: timeSec as Time,
          position: isLong ? 'belowBar' : 'aboveBar',
          color: isLong ? '#16a34a' : '#ef4444',
          shape: isLong ? 'arrowUp' : 'arrowDown',
          text: `#${tradeNum} Entry ${isLong ? 'Buy' : 'Sell'} @ ${formatNum(t.price)}`,
          size: 2,
        });
      } else if (isExit) {
        const pnl = t.netPnl ?? 0;
        markers.push({
          time: timeSec as Time,
          position: isLong ? 'aboveBar' : 'belowBar',
          color: pnl >= 0 ? '#10b981' : '#f43f5e',
          shape: isLong ? 'arrowDown' : 'arrowUp',
          text: `#${tradeNum} Exit @ ${formatNum(t.price)} (${pnl >= 0 ? '+' : ''}${formatNum(pnl)})`,
          size: 2,
        });
      }
    });

    return markers.sort((a, b) => Number(a.time) - Number(b.time));
  }, [backtestResult, candles, snapTimeToCandle, interval]);


  // 5. Initialize Lightweight Charts (Runs ONCE on mount)
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.textColor,
        watermark: { visible: false },
      },
      width,
      height,
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      crosshair: {
        mode: CrosshairMode.Hidden,
      },
      rightPriceScale: {
        borderColor: palette.border,
      },
      timeScale: {
        borderColor: palette.border,
        timeVisible: true,
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
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const smaSeries = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      title: `SMA ${SMA_PERIOD}`,
    });

    const equitySeries = chart.addLineSeries({
      color: '#8b5cf6',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceScaleId: 'equity',
      lastValueVisible: true,
      priceLineVisible: false,
      title: 'Equity',
    });

    equitySeries.priceScale().applyOptions({
      position: 'left',
      scaleMargins: { top: 0.1, bottom: 0.35 },
      borderColor: palette.border,
    });

    candleSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    smaSeriesRef.current = smaSeries;
    equitySeriesRef.current = equitySeries;

    // Set initial fallback data immediately
    const initialCandles = candlesRef.current;
    if (initialCandles.length > 0) {
      candlestickSeries.setData(
        initialCandles.map(({ time, open, high, low, close }) => ({
          time: time as Time,
          open,
          high,
          low,
          close,
        }))
      );
      volumeSeries.setData(
        initialCandles.map((c) => ({
          time: c.time as Time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(38, 166, 154, 0.55)' : 'rgba(239, 83, 80, 0.55)',
        }))
      );
    }

    // Crosshair Move
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

        if (candle && candlesRef.current.length > 1) {
          const list = candlesRef.current;
          const prev = list[list.length - 2] || list[0];
          const first = list[0];
          const chg = candle.close - prev.close;
          const chgPct = prev.close > 0 ? (chg / prev.close) * 100 : 0;
          const periodChange = candle.close - first.open;
          const periodChangePct = first.open > 0 ? (periodChange / first.open) * 100 : 0;

          setData({
            time: formatTimeLabel(timeValue),
            open: formatNum(candle.open),
            high: formatNum(candle.high),
            low: formatNum(candle.low),
            close: formatNum(candle.close),
            change: (chg >= 0 ? '+' : '') + formatNum(chg),
            changePct: (chgPct >= 0 ? '+' : '') + formatNum(chgPct) + '%',
            volume: vol ? formatVolume(vol.value) : '—',
            bid: formatNum(candle.close * 0.9998),
            ask: formatNum(candle.close * 1.0002),
            periodChange: (periodChange >= 0 ? '+' : '') + formatNum(periodChange),
            periodChangePct: (periodChangePct >= 0 ? '+' : '') + formatNum(periodChangePct) + '%',
          });
        }
      } else {
        setCrosshair(null);
      }
    });

    // Lazy load listener via stable Ref
    chart.timeScale().subscribeVisibleLogicalRangeChange((range: LogicalRange | null) => {
      if (range && range.from < 50) {
        fetchOlderKlinesRef.current?.();
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
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      smaSeriesRef.current = null;
      equitySeriesRef.current = null;
    };
  }, []);

  // 6. Update series data when `candles` state updates
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) {
      return;
    }

    const candleData = candles.map(({ time, open, high, low, close }) => ({
      time: time as Time,
      open,
      high,
      low,
      close,
    }));

    const volumeData = candles.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(38, 166, 154, 0.55)' : 'rgba(239, 83, 80, 0.55)',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    if (smaSeriesRef.current) {
      smaSeriesRef.current.setData(smaData);
    }

    // Update Header
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || last;
    const first = candles[0];
    const change = last.close - prev.close;
    const changePct = prev.close > 0 ? (change / prev.close) * 100 : 0;
    const periodChange = last.close - first.open;
    const periodChangePct = first.open > 0 ? (periodChange / first.open) * 100 : 0;

    setData({
      time: formatTimeLabel(last.time),
      open: formatNum(last.open),
      high: formatNum(last.high),
      low: formatNum(last.low),
      close: formatNum(last.close),
      change: (change >= 0 ? '+' : '') + formatNum(change),
      changePct: (changePct >= 0 ? '+' : '') + formatNum(changePct) + '%',
      volume: formatVolume(last.volume),
      bid: formatNum(last.close * 0.9998),
      ask: formatNum(last.close * 1.0002),
      periodChange: (periodChange >= 0 ? '+' : '') + formatNum(periodChange),
      periodChangePct: (periodChangePct >= 0 ? '+' : '') + formatNum(periodChangePct) + '%',
    });
  }, [candles, smaData, setData]);

  // 7. Update Trade Markers
  useEffect(() => {
    if (candleSeriesRef.current) {
      candleSeriesRef.current.setMarkers(tradeMarkers);
    }
  }, [tradeMarkers]);

  // 8. Update Equity Curve Series
  useEffect(() => {
    if (!equitySeriesRef.current) return;

    if (!showEquityCurve || !backtestResult?.equityCurve || backtestResult.equityCurve.length === 0 || candles.length === 0) {
      equitySeriesRef.current.setData([]);
      return;
    }

    const testInterval = backtestResult?.timeframe || interval;
    const map = new Map<number, number>();
    backtestResult.equityCurve.forEach((pt) => {
      const rawSec = Math.floor(new Date(pt.timestamp).getTime() / 1000);
      if (!isNaN(rawSec) && pt.equity != null) {
        const timeSec = snapTimeToCandle(rawSec, candles, testInterval);
        map.set(timeSec, pt.equity);
      }
    });

    const equityData = Array.from(map.entries())
      .map(([time, value]) => ({ time: time as Time, value }))
      .sort((a, b) => Number(a.time) - Number(b.time));

    equitySeriesRef.current.setData(equityData);
  }, [backtestResult, showEquityCurve, candles, snapTimeToCandle, interval]);

  // 9. Scroll to selected trade when user clicks in Trade History table
  useEffect(() => {
    if (!selectedTradeTime || !chartRef.current || candles.length === 0) return;

    const testInterval = backtestResult?.timeframe || interval;
    const snapped = snapTimeToCandle(selectedTradeTime, candles, testInterval);
    const index = candles.findIndex((c) => c.time === snapped);
    if (index !== -1) {
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: Math.max(0, index - 25),
        to: Math.min(candles.length - 1, index + 25),
      });
    }
  }, [selectedTradeTime, candles, snapTimeToCandle, backtestResult, interval]);


  // 8. WebSocket live klines subscription
  useEffect(() => {
    const cleanSymbol = symbol.replace('/', '').toUpperCase();

    const unsubChart = websocketService.subscribeChart(
      cleanSymbol,
      interval,
      (kline: RealtimeKline) => {
        if (!kline || !candleSeriesRef.current || !volumeSeriesRef.current) return;

        const timeInSec = Math.floor((kline.openTime || kline.closeTime || Date.now()) / 1000);
        const candleItem = {
          time: timeInSec as Time,
          open: parseFloat(String(kline.open)),
          high: parseFloat(String(kline.high)),
          low: parseFloat(String(kline.low)),
          close: parseFloat(String(kline.close)),
        };

        candleSeriesRef.current.update(candleItem);

        volumeSeriesRef.current.update({
          time: timeInSec as Time,
          value: parseFloat(String(kline.volume || 0)),
          color: candleItem.close >= candleItem.open ? 'rgba(38, 166, 154, 0.55)' : 'rgba(239, 83, 80, 0.55)',
        });
      }
    );

    return () => {
      unsubChart();
    };
  }, [symbol, interval]);

  // 9. Theme updates
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.textColor,
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      rightPriceScale: { borderColor: palette.border },
      timeScale: { borderColor: palette.border },
    });
  }, [palette]);

  return (
    <div className="relative w-full h-full">
      {loadingKlines && (
        <div className="absolute inset-0 z-30 bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xs flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <Loader2 className="size-5 animate-spin text-blue-500" />
          <span>Loading market candles…</span>
        </div>
      )}

      {loadingOlder && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-gray-900/85 dark:bg-gray-800/90 text-white px-3.5 py-1 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-xs">
          <Loader2 className="size-3.5 animate-spin text-blue-400" />
          <span>Loading historical candles…</span>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />

      {crosshair && crosshair.price !== null && crosshair.time !== null && (
        <>
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left: crosshair.x,
              top: 0,
              bottom: 0,
              width: 1,
              background: palette.crosshairLine,
              transform: 'translateX(-0.5px)',
            }}
          />
          <div
            className="absolute pointer-events-none z-10"
            style={{
              top: crosshair.y,
              left: 0,
              right: 0,
              height: 1,
              background: palette.crosshairLine,
              transform: 'translateY(-0.5px)',
            }}
          />
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

      {/* Backtest Result Floating HUD */}
      {backtestResult && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-white/90 dark:bg-gray-850/90 backdrop-blur-md px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg text-xs whitespace-nowrap">
          <div className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-100">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
            <span>{backtestResult.strategyType}</span>
          </div>

          <div className="w-px h-3.5 bg-gray-300 dark:bg-gray-600" />

          <div className="flex items-center gap-1">
            <span className="text-gray-500 dark:text-gray-400">Return:</span>
            <span
              className={`font-bold tabular-nums ${
                (backtestResult.metrics?.totalReturnPercent ?? 0) >= 0
                  ? 'text-emerald-500'
                  : 'text-rose-500'
              }`}
            >
              {(backtestResult.metrics?.totalReturnPercent ?? 0) >= 0 ? '+' : ''}
              {formatNum(backtestResult.metrics?.totalReturnPercent, 2)}%
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500 dark:text-gray-400">Win Rate:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
              {formatNum(backtestResult.metrics?.winRate, 1)}%
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-500 dark:text-gray-400">Trades:</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
              {backtestResult.metrics?.totalTrades ?? backtestResult.trades?.length ?? 0}
            </span>
          </div>

          <div className="w-px h-3.5 bg-gray-300 dark:bg-gray-600" />

          {/* Toggle Equity Curve button */}
          <button
            onClick={() => setShowEquityCurve((prev) => !prev)}
            className={`px-2 py-0.5 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
              showEquityCurve
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400'
            }`}
            title="Toggle Equity Curve on chart"
          >
            {showEquityCurve ? '● Equity Curve' : '○ Equity Curve'}
          </button>
        </div>
      )}
    </div>
  );
}
