import type { CandleRow } from '../../types/market.types';

export function formatNum(n: number | undefined | null, decimals = 2): string {
  if (n === undefined || n === null || isNaN(n)) return '—';
  if (Math.abs(n) < 0.0001 && n !== 0) return n.toFixed(6);
  if (Math.abs(n) < 1) return n.toFixed(4);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatVolume(v: number | undefined | null): string {
  if (v === undefined || v === null || isNaN(v)) return '—';
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(2) + 'K';
  return v.toFixed(2);
}

export function formatTimeLabel(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}

export function getIntervalSeconds(intv: string): number {
  const unit = intv.slice(-1);
  const val = parseInt(intv.slice(0, -1), 10) || 1;
  if (unit === 'm') return val * 60;
  if (unit === 'h') return val * 3600;
  if (unit === 'd') return val * 86400;
  if (unit === 'w') return val * 604800;
  if (unit === 'M') return val * 2592000;
  return 3600;
}

export function snapTimeToCandle(
  targetSec: number,
  candleList: CandleRow[],
  _intv?: string
): number {
  if (candleList.length === 0) return targetSec;

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

  // Lightweight Charts REQUIRES markers to match an existing candle timestamp in the series
  return candleList[bestIdx].time;
}
