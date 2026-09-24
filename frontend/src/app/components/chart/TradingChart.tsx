import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle, ISeriesApi, SeriesMarker, Time, LogicalRange } from 'lightweight-charts';
import { useOHLCV } from '../../context/OHLCVContext';
import { useTheme } from '../../context/ThemeContext';
import { marketApi } from '../../services/marketApi';
import { websocketService, RealtimeKline } from '../../services/websocketService';
import { BTC_USD_DAILY } from '../../data/mockOHLCV';
import { IndicatorSettingsModal } from './IndicatorSettingsModal';
import { formatNum, formatVolume, formatTimeLabel, snapTimeToCandle, getIntervalSeconds } from './chartFormatters';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateATR,
} from './chartCalculations';
import type { SelectedIndicator, SelectedStrategy } from '../../types/indicator.types';
import type { CandleRow, KlineResponse } from '../../types/market.types';
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

interface OverlayRowProps {
  items: { id?: string; name: string; color?: string; badge?: 'NEW' | 'BETA' }[];
  hiddenSet?: Set<string>;
  collapsed: boolean;
  onToggleVisibility?: (idOrName: string) => void;
  onRemove?: (idOrName: string) => void;
  onOpenSettings?: (item: any) => void;
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
  onOpenSettings,
  onToggleCollapse,
  groupLabel,
  icon,
}: OverlayRowProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col items-start gap-0.5 bg-white/85 dark:bg-gray-850/85 backdrop-blur-xs p-1.5 rounded-lg border border-gray-200/60 dark:border-gray-700/60 shadow-xs">
      {!collapsed &&
        items.map((item) => {
          const itemKey = item.id || item.name;
          const isHidden = (hiddenSet?.has(itemKey) || (item.id && hiddenSet?.has(item.id)) || hiddenSet?.has(item.name)) ?? false;
          return (
            <div
              key={itemKey}
              className="group inline-flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200 py-0.5"
            >
              {item.color && (
                <span
                  className="size-2 rounded-full shrink-0 border border-black/10 dark:border-white/10"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className={`font-medium ${isHidden ? 'opacity-40 line-through text-gray-400' : ''}`}>
                {item.name}
              </span>
              {onToggleVisibility && (
                <button
                  onClick={() => onToggleVisibility(itemKey)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title={isHidden ? `Show ${item.name}` : `Hide ${item.name}`}
                >
                  {isHidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              )}
              {onOpenSettings && (
                <button
                  onClick={() => onOpenSettings(item)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title={`${item.name} settings`}
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              )}
              {onRemove && (
                <button
                  onClick={() => onRemove(itemKey)}
                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
        className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 mt-0.5 cursor-pointer"
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
  onUpdateIndicator,
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
  onUpdateIndicator?: (updated: SelectedIndicator) => void;
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
  const equitySeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const indicatorSeriesMapRef = useRef<Map<string, ISeriesApi<any>[]>>(new Map());
  const [showEquityCurve, setShowEquityCurve] = useState(true);
  const [editingIndicator, setEditingIndicator] = useState<SelectedIndicator | null>(null);

  const { symbol, interval, activeStrategyName, setData, backtestResult, selectedTradeTime } = useOHLCV();
  const { isDark } = useTheme();
  const themeName: ThemeName = isDark ? 'dark' : 'light';
  const palette = CHART_THEMES[themeName];

  const [loadingKlines, setLoadingKlines] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
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

  const isStrategyHidden = useMemo(() => {
    if (allStrategiesHidden) return true;
    if (!selectedStrategies || selectedStrategies.length === 0) return true;
    if (!activeStrategyName) return true;
    const isSelected = selectedStrategies.some((s) => s.name === activeStrategyName);
    if (!isSelected) return true;
    return hiddenStrategies?.has(activeStrategyName) ?? false;
  }, [allStrategiesHidden, activeStrategyName, selectedStrategies, hiddenStrategies]);

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
        console.warn('[TradingChart] Fallback to mock klines:', err);
      } finally {
        if (!isCancelled) setLoadingKlines(false);
      }
    };

    fetchKlines();

    return () => {
      isCancelled = true;
    };
  }, [symbol, interval]);

  // 2. Fetch full historical range when backtestResult is received
  useEffect(() => {
    if (!backtestResult?.startTime || !backtestResult?.endTime) return;

    let isCancelled = false;
    const cleanSymbol = (backtestResult.symbol || symbol).replace('/', '').toUpperCase();
    const testInterval = backtestResult.timeframe || interval;
    const startMs = new Date(backtestResult.startTime).getTime();
    const endMs = new Date(backtestResult.endTime).getTime();

    if (isNaN(startMs) || isNaN(endMs)) return;

    const fetchBacktestHistory = async () => {
      setLoadingOlder(true);
      try {
        let currentStart = startMs;
        let allKlines: CandleRow[] = [];
        const intervalSec = getIntervalSeconds(testInterval);
        const maxBarsToFetch = 30000;
        let batchCount = 0;

        while (currentStart < endMs && allKlines.length < maxBarsToFetch && batchCount < 30) {
          batchCount++;
          const batch = await marketApi.getKlines({
            symbol: cleanSymbol,
            interval: testInterval,
            startTime: currentStart,
            endTime: endMs,
            limit: 1000,
          });

          if (!batch || batch.length === 0) break;
          const parsedBatch = parseKlines(batch);
          if (parsedBatch.length === 0) break;

          const lastParsed = parsedBatch[parsedBatch.length - 1];
          const nextStart = (lastParsed.time + intervalSec) * 1000;

          if (allKlines.length > 0) {
            const existingTimes = new Set(allKlines.map((c) => c.time));
            const newOnly = parsedBatch.filter((c) => !existingTimes.has(c.time));
            allKlines = allKlines.concat(newOnly);
          } else {
            allKlines = parsedBatch;
          }

          if (parsedBatch.length < 1000 || nextStart <= currentStart) break;
          currentStart = nextStart;
        }

        if (!isCancelled && allKlines.length > 0) {
          setCandles((prev) => {
            const existingTimes = new Set(allKlines.map((c) => c.time));
            const prevWithoutOverlap = prev.filter((c) => !existingTimes.has(c.time));
            const combined = [...allKlines, ...prevWithoutOverlap].sort((a, b) => a.time - b.time);
            return combined;
          });

          // Auto-scroll viewport to backtest period
          const firstCandle = allKlines[0];
          const lastCandle = allKlines[allKlines.length - 1];
          setTimeout(() => {
            if (chartRef.current && firstCandle && lastCandle) {
              chartRef.current.timeScale().setVisibleRange({
                from: firstCandle.time as Time,
                to: lastCandle.time as Time,
              });
            }
          }, 150);
        }
      } catch (err) {
        console.warn('[TradingChart] Failed to fetch backtest historical range:', err);
      } finally {
        if (!isCancelled) setLoadingOlder(false);
      }
    };

    fetchBacktestHistory();

    return () => {
      isCancelled = true;
    };
  }, [backtestResult, symbol, interval]);

  // 3. Lazy load older klines on scroll left
  const fetchOlderKlines = useCallback(async () => {
    if (isLoadingOlderRef.current || !hasMoreOlderRef.current) return;
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 500) return;
    lastFetchTimeRef.current = now;

    const currentCandles = candlesRef.current;
    if (currentCandles.length === 0) return;

    const earliestTimeSec = currentCandles[0].time;
    const cleanSymbol = symbol.replace('/', '').toUpperCase();

    isLoadingOlderRef.current = true;
    setLoadingOlder(true);

    try {
      const raw = await marketApi.getKlines({
        symbol: cleanSymbol,
        interval,
        endTime: earliestTimeSec * 1000 - 1,
        limit: 500,
      });

      if (!Array.isArray(raw) || raw.length === 0) {
        hasMoreOlderRef.current = false;
        return;
      }

      const older = parseKlines(raw);
      if (older.length === 0) {
        hasMoreOlderRef.current = false;
        return;
      }

      const existingTimes = new Set(currentCandles.map((c) => c.time));
      const newOlder = older.filter((c) => !existingTimes.has(c.time));

      if (newOlder.length === 0) {
        hasMoreOlderRef.current = false;
        return;
      }

      const merged = [...newOlder, ...currentCandles].sort((a, b) => a.time - b.time);
      const addedCount = newOlder.length;
      setCandles(merged);

      const chart = chartRef.current;
      if (chart) {
        const currentRange = chart.timeScale().getVisibleLogicalRange();
        requestAnimationFrame(() => {
          if (!currentRange || !chartRef.current) return;
          chartRef.current.timeScale().setVisibleLogicalRange({
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

  // 4. Convert Backtest Trades to Chart Markers
  const tradeMarkers = useMemo<SeriesMarker<Time>[]>(() => {
    if (isStrategyHidden || !backtestResult?.trades || backtestResult.trades.length === 0 || candles.length === 0) {
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
  }, [backtestResult, candles, interval, isStrategyHidden]);

  const tradeMarkersRef = useRef<SeriesMarker<Time>[]>(tradeMarkers);
  tradeMarkersRef.current = tradeMarkers;

  // Viewport culling & Level of Detail for markers
  const updateCulledMarkers = useCallback(() => {
    if (!candleSeriesRef.current || !chartRef.current) return;
    const allMarkers = tradeMarkersRef.current;
    if (allMarkers.length === 0) {
      candleSeriesRef.current.setMarkers([]);
      return;
    }

    if (allMarkers.length <= 100) {
      candleSeriesRef.current.setMarkers(allMarkers);
      return;
    }

    const range = chartRef.current.timeScale().getVisibleRange();
    if (!range || range.from === null || range.to === null) {
      candleSeriesRef.current.setMarkers(allMarkers);
      return;
    }

    const fromTime = Number(range.from);
    const toTime = Number(range.to);
    const span = Math.max(0, toTime - fromTime);
    const buffer = span * 0.35; // 35% buffer to prevent edge pop-in
    const minTime = fromTime - buffer;
    const maxTime = toTime + buffer;

    const visibleMarkers = allMarkers.filter((m) => {
      const t = Number(m.time);
      return t >= minTime && t <= maxTime;
    });

    // Level of Detail: when zoomed out with many markers, strip text to avoid text layout overhead
    if (visibleMarkers.length > 200) {
      const compactMarkers = visibleMarkers.map((m) => ({
        ...m,
        text: undefined,
      }));
      candleSeriesRef.current.setMarkers(compactMarkers);
    } else {
      candleSeriesRef.current.setMarkers(visibleMarkers);
    }
  }, []);

  const updateCulledMarkersRef = useRef(updateCulledMarkers);
  updateCulledMarkersRef.current = updateCulledMarkers;

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
        rightOffset: 12,
        barSpacing: 10,
        minBarSpacing: 2,
        fixLeftEdge: false,
        fixRightEdge: false,
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
    equitySeriesRef.current = equitySeries;

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
      updateCulledMarkersRef.current?.();
      requestAnimationFrame(() => {
        chart.timeScale().fitContent();
      });
    }

    // High performance throttled crosshair move (requestAnimationFrame)
    let crosshairRafId: number | null = null;
    let latestCrosshairParam: any = null;

    chart.subscribeCrosshairMove((param) => {
      latestCrosshairParam = param;
      if (crosshairRafId === null) {
        crosshairRafId = requestAnimationFrame(() => {
          crosshairRafId = null;
          const p = latestCrosshairParam;
          if (!p) return;

          const x = p.point?.x;
          const y = p.point?.y;

          if (p.time && x !== undefined && y !== undefined) {
            const candle = p.seriesData.get(candlestickSeries) as
              | { open: number; high: number; low: number; close: number }
              | undefined;

            const vol = p.seriesData.get(volumeSeries) as { value: number } | undefined;
            const timeValue = Number(p.time);

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
      }
    });

    // Throttled visible range listener for lazy-load + marker culling
    let rangeRafId: number | null = null;
    chart.timeScale().subscribeVisibleLogicalRangeChange((range: LogicalRange | null) => {
      if (range && range.from < 50) {
        fetchOlderKlinesRef.current?.();
      }
      if (rangeRafId === null) {
        rangeRafId = requestAnimationFrame(() => {
          rangeRafId = null;
          updateCulledMarkersRef.current?.();
        });
      }
    });

    let resizeRafId: number | null = null;
    const handleResize = () => {
      if (resizeRafId !== null) return;
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
        if (containerRef.current && chartRef.current) {
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;
          if (width > 0 && height > 0) {
            chartRef.current.applyOptions({ width, height });
          }
        }
      });
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (crosshairRafId !== null) cancelAnimationFrame(crosshairRafId);
      if (rangeRafId !== null) cancelAnimationFrame(rangeRafId);
      if (resizeRafId !== null) cancelAnimationFrame(resizeRafId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      indicatorSeriesMapRef.current.clear();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
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
    updateCulledMarkersRef.current?.();
    volumeSeriesRef.current.setData(volumeData);

    requestAnimationFrame(() => {
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    });

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
  }, [candles, setData]);

  // 7. Dynamic Technical Indicators Rendering
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candles.length === 0) return;

    const currentMap = indicatorSeriesMapRef.current;
    const selectedKeys = new Set(selectedIndicators.map((i) => i.id || i.name));

    Array.from(currentMap.keys()).forEach((key) => {
      if (!selectedKeys.has(key)) {
        const seriesList = currentMap.get(key) || [];
        seriesList.forEach((s) => {
          try {
            chart.removeSeries(s);
          } catch (e) {}
        });
        currentMap.delete(key);
      }
    });

    selectedIndicators.forEach((ind) => {
      const indKey = ind.id || ind.name;
      const isHidden =
        !!allIndicatorsHidden ||
        (hiddenIndicators?.has(indKey) ?? false) ||
        (ind.id ? (hiddenIndicators?.has(ind.id) ?? false) : false) ||
        (hiddenIndicators?.has(ind.name) ?? false);

      const lower = (ind.type || ind.name).toLowerCase();
      const lineColor = ind.color || '#f59e0b';

      let seriesList = currentMap.get(indKey);
      if (!seriesList) {
        seriesList = [];
        if (lower.includes('sma') || lower.includes('simple moving average')) {
          const s = chart.addLineSeries({
            color: lineColor,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
            title: ind.name,
          });
          seriesList.push(s);
        } else if (lower.includes('ema') || lower.includes('exponential')) {
          const s = chart.addLineSeries({
            color: lineColor,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
            title: ind.name,
          });
          seriesList.push(s);
        } else if (lower.includes('bollinger')) {
          const upper = chart.addLineSeries({
            color: lineColor,
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            priceLineVisible: false,
            lastValueVisible: false,
            title: `${ind.name} Upper`,
          });
          const middle = chart.addLineSeries({
            color: lineColor,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: true,
            title: `${ind.name} Mid`,
          });
          const lowerS = chart.addLineSeries({
            color: lineColor,
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            priceLineVisible: false,
            lastValueVisible: false,
            title: `${ind.name} Lower`,
          });
          seriesList.push(upper, middle, lowerS);
        } else if (lower.includes('rsi')) {
          const rsiSeries = chart.addLineSeries({
            color: lineColor,
            lineWidth: 2,
            priceScaleId: 'rsi',
            lastValueVisible: true,
            priceLineVisible: false,
            title: ind.name,
          });
          rsiSeries.priceScale().applyOptions({
            position: 'left',
            scaleMargins: { top: 0.7, bottom: 0.05 },
            borderColor: palette.border,
          });
          seriesList.push(rsiSeries);
        } else if (lower.includes('macd')) {
          const macdLine = chart.addLineSeries({
            color: lineColor,
            lineWidth: 2,
            priceScaleId: 'macd',
            lastValueVisible: true,
            priceLineVisible: false,
            title: `${ind.name} MACD`,
          });
          const signalLine = chart.addLineSeries({
            color: '#f97316',
            lineWidth: 1.5,
            priceScaleId: 'macd',
            lastValueVisible: true,
            priceLineVisible: false,
            title: `${ind.name} Signal`,
          });
          macdLine.priceScale().applyOptions({
            position: 'left',
            scaleMargins: { top: 0.75, bottom: 0.02 },
            borderColor: palette.border,
          });
          seriesList.push(macdLine, signalLine);
        } else if (lower.includes('atr') || lower.includes('average true range')) {
          const atrSeries = chart.addLineSeries({
            color: lineColor,
            lineWidth: 2,
            priceScaleId: 'atr',
            lastValueVisible: true,
            priceLineVisible: false,
            title: ind.name,
          });
          atrSeries.priceScale().applyOptions({
            position: 'left',
            scaleMargins: { top: 0.8, bottom: 0.02 },
            borderColor: palette.border,
          });
          seriesList.push(atrSeries);
        }
        currentMap.set(indKey, seriesList);
      } else {
        if (lower.includes('sma') || lower.includes('simple moving average') || lower.includes('ema') || lower.includes('exponential') || lower.includes('rsi') || lower.includes('atr')) {
          seriesList[0]?.applyOptions({ color: lineColor, title: ind.name });
        } else if (lower.includes('bollinger')) {
          seriesList[0]?.applyOptions({ color: lineColor, title: `${ind.name} Upper` });
          seriesList[1]?.applyOptions({ color: lineColor, title: `${ind.name} Mid` });
          seriesList[2]?.applyOptions({ color: lineColor, title: `${ind.name} Lower` });
        } else if (lower.includes('macd')) {
          seriesList[0]?.applyOptions({ color: lineColor, title: `${ind.name} MACD` });
        }
      }

      if (isHidden) {
        seriesList.forEach((s) => s.setData([]));
      } else {
        if (lower.includes('sma') || lower.includes('simple moving average')) {
          const data = calculateSMA(candles, ind.period ?? 20);
          seriesList[0]?.setData(data);
        } else if (lower.includes('ema') || lower.includes('exponential')) {
          const data = calculateEMA(candles, ind.period ?? 20);
          seriesList[0]?.setData(data);
        } else if (lower.includes('bollinger')) {
          const { upper, middle, lower: lowerData } = calculateBollingerBands(
            candles,
            ind.period ?? 20,
            ind.multiplier ?? 2
          );
          seriesList[0]?.setData(upper);
          seriesList[1]?.setData(middle);
          seriesList[2]?.setData(lowerData);
        } else if (lower.includes('rsi')) {
          const data = calculateRSI(candles, ind.period ?? 14);
          seriesList[0]?.setData(data);
        } else if (lower.includes('macd')) {
          const { macdLine, signalLine } = calculateMACD(
            candles,
            ind.fastPeriod ?? 12,
            ind.slowPeriod ?? 26,
            ind.signalPeriod ?? 9
          );
          seriesList[0]?.setData(macdLine);
          seriesList[1]?.setData(signalLine);
        } else if (lower.includes('atr') || lower.includes('average true range')) {
          const data = calculateATR(candles, ind.period ?? 14);
          seriesList[0]?.setData(data);
        }
      }
    });
  }, [candles, selectedIndicators, hiddenIndicators, allIndicatorsHidden, palette]);

  // 8. Update Trade Markers
  useEffect(() => {
    updateCulledMarkersRef.current?.();
  }, [tradeMarkers]);

  // 9. Update Equity Curve Series with high-volume downsampling
  useEffect(() => {
    if (!equitySeriesRef.current) return;

    if (isStrategyHidden || !showEquityCurve || !backtestResult?.equityCurve || backtestResult.equityCurve.length === 0 || candles.length === 0) {
      equitySeriesRef.current.setData([]);
      return;
    }

    const testInterval = backtestResult?.timeframe || interval;
    const rawPoints = backtestResult.equityCurve;

    // Decimate/downsample points if larger than 2,500 to keep UI 60 FPS
    const maxPoints = 2500;
    const step = rawPoints.length > maxPoints ? Math.ceil(rawPoints.length / maxPoints) : 1;

    const map = new Map<number, number>();
    for (let i = 0; i < rawPoints.length; i += step) {
      const pt = rawPoints[i];
      const rawSec = Math.floor(new Date(pt.timestamp).getTime() / 1000);
      if (!isNaN(rawSec) && pt.equity != null) {
        const timeSec = snapTimeToCandle(rawSec, candles, testInterval);
        map.set(timeSec, pt.equity);
      }
    }

    // Ensure last point is always preserved
    const lastPt = rawPoints[rawPoints.length - 1];
    if (lastPt) {
      const rawSec = Math.floor(new Date(lastPt.timestamp).getTime() / 1000);
      if (!isNaN(rawSec) && lastPt.equity != null) {
        const timeSec = snapTimeToCandle(rawSec, candles, testInterval);
        map.set(timeSec, lastPt.equity);
      }
    }

    const equityData = Array.from(map.entries())
      .map(([time, value]) => ({ time: time as Time, value }))
      .sort((a, b) => Number(a.time) - Number(b.time));

    equitySeriesRef.current.setData(equityData);
  }, [backtestResult, showEquityCurve, candles, interval, isStrategyHidden]);

  // 10. Scroll to selected trade when user clicks in Trade History table
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
  }, [selectedTradeTime, candles, backtestResult, interval]);

  // 11. WebSocket live klines subscription
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

  // 12. Theme updates
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
            onOpenSettings={(item) => setEditingIndicator(item as SelectedIndicator)}
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
      {backtestResult && !isStrategyHidden && (
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

      {/* Indicator Settings Modal */}
      {editingIndicator && (
        <IndicatorSettingsModal
          indicator={editingIndicator}
          isOpen={!!editingIndicator}
          onClose={() => setEditingIndicator(null)}
          onSave={(updated) => {
            onUpdateIndicator?.(updated);
            setEditingIndicator(null);
          }}
        />
      )}
    </div>
  );
}
