import { useEffect, useMemo, useRef } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { useOHLCV } from './OHLCVContext';
import { BTC_USD_DAILY } from '../data/mockOHLCV';

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

export function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const candleSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']> | null>(null);
  const volumeSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addHistogramSeries']> | null>(null);
  const { setData } = useOHLCV();

  const candles = useMemo(() => buildCandles(BTC_USD_DAILY), []);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
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
      if (!param.time) return;

      const candle = param.seriesData.get(candlestickSeries) as
        | { open: number; high: number; low: number; close: number }
        | undefined;

      const vol = param.seriesData.get(volumeSeries) as { value: number } | undefined;

      if (candle) {
        const timeValue = Number(param.time);
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
  }, [candles, setData]);

  return <div ref={containerRef} className="w-full h-full" />;
}
