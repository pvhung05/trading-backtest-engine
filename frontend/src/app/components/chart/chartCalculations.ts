import type { Time } from 'lightweight-charts';
import type { CandleRow } from '../../types/market.types';

export function calculateSMA(candles: CandleRow[], period = 20): { time: Time; value: number }[] {
  const out: { time: Time; value: number }[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) {
      out.push({ time: candles[i].time as Time, value: sum / period });
    }
  }
  return out;
}

export function calculateEMA(candles: CandleRow[], period = 20): { time: Time; value: number }[] {
  if (candles.length < period) return [];
  const out: { time: Time; value: number }[] = [];
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += candles[i].close;
  let ema = sum / period;
  out.push({ time: candles[period - 1].time as Time, value: ema });
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    out.push({ time: candles[i].time as Time, value: ema });
  }
  return out;
}

export function calculateBollingerBands(candles: CandleRow[], period = 20, multiplier = 2) {
  const upper: { time: Time; value: number }[] = [];
  const middle: { time: Time; value: number }[] = [];
  const lower: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    const mean = sum / period;
    let varSum = 0;
    for (let j = i - period + 1; j <= i; j++) varSum += Math.pow(candles[j].close - mean, 2);
    const stdDev = Math.sqrt(varSum / period);
    const time = candles[i].time as Time;
    middle.push({ time, value: mean });
    upper.push({ time, value: mean + multiplier * stdDev });
    lower.push({ time, value: mean - multiplier * stdDev });
  }
  return { upper, middle, lower };
}

export function calculateRSI(candles: CandleRow[], period = 14): { time: Time; value: number }[] {
  if (candles.length <= period) return [];
  const out: { time: Time; value: number }[] = [];
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  out.push({ time: candles[period].time as Time, value: rsi });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    out.push({ time: candles[i].time as Time, value: rsi });
  }
  return out;
}

export function calculateMACD(candles: CandleRow[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEma = calculateEMA(candles, fastPeriod);
  const slowEma = calculateEMA(candles, slowPeriod);
  const slowMap = new Map<number, number>(slowEma.map((p) => [Number(p.time), p.value]));

  const macdLine: { time: Time; value: number }[] = [];
  fastEma.forEach((f) => {
    const sVal = slowMap.get(Number(f.time));
    if (sVal !== undefined) {
      macdLine.push({ time: f.time, value: f.value - sVal });
    }
  });

  if (macdLine.length < signalPeriod) return { macdLine: [], signalLine: [] };

  const k = 2 / (signalPeriod + 1);
  let sum = 0;
  for (let i = 0; i < signalPeriod; i++) sum += macdLine[i].value;
  let sig = sum / signalPeriod;
  const signalLine: { time: Time; value: number }[] = [
    { time: macdLine[signalPeriod - 1].time, value: sig },
  ];
  for (let i = signalPeriod; i < macdLine.length; i++) {
    sig = macdLine[i].value * k + sig * (1 - k);
    signalLine.push({ time: macdLine[i].time, value: sig });
  }
  return { macdLine, signalLine };
}

export function calculateATR(candles: CandleRow[], period = 14): { time: Time; value: number }[] {
  if (candles.length <= period) return [];
  const trList: { time: Time; tr: number }[] = [];
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high;
    const l = candles[i].low;
    const prevC = candles[i - 1].close;
    const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    trList.push({ time: candles[i].time as Time, tr });
  }
  if (trList.length < period) return [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += trList[i].tr;
  let atr = sum / period;
  const out: { time: Time; value: number }[] = [{ time: trList[period - 1].time, value: atr }];
  for (let i = period; i < trList.length; i++) {
    atr = (atr * (period - 1) + trList[i].tr) / period;
    out.push({ time: trList[i].time, value: atr });
  }
  return out;
}
