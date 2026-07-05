import { BTC_USD_DAILY } from './mockOHLCV';

export interface MockTrade {
  // Unix seconds (same time format as candles in TradingChart).
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  side: 'long' | 'short';
  pnl: number;
}

const toUnix = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

const closeMap = new Map(BTC_USD_DAILY.map((c) => [c.endTime, c.close]));
const byIndex = (i: number) => BTC_USD_DAILY[i].endTime;

/**
 * Hand-picked trade examples scattered across the BTC_USD_DAILY series.
 * The prices are nudged to the closest candle close so the markers
 * visually land on a real candle.
 */
function pickTrade(
  entryIdx: number,
  exitIdx: number,
  side: 'long' | 'short',
  priceNudge = 0
): MockTrade {
  const entryTime = toUnix(byIndex(entryIdx));
  const exitTime = toUnix(byIndex(exitIdx));
  const entryClose = BTC_USD_DAILY[entryIdx].close;
  const exitClose = BTC_USD_DAILY[exitIdx].close;
  const entryPrice = entryClose + priceNudge;
  const exitPrice = exitClose + (priceNudge > 0 ? -120 : 80);
  const pnl = side === 'long' ? exitPrice - entryPrice : entryPrice - exitPrice;
  return { entryTime, entryPrice, exitTime, exitPrice, side, pnl };
}

export const MOCK_TRADES: MockTrade[] = [
  pickTrade(3, 8, 'long'),
  pickTrade(11, 16, 'long'),
  pickTrade(20, 28, 'long'),
  pickTrade(35, 42, 'long'),
  pickTrade(55, 63, 'long'),
  pickTrade(70, 78, 'long'),
  pickTrade(90, 96, 'long'),
  pickTrade(105, 112, 'long'),
  // Last few may be near the end of the array.
  ...(BTC_USD_DAILY.length > 120
    ? [pickTrade(118, 125, 'long')]
    : []),
];
