import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { SelectedIndicator } from '../../types/indicator.types';

interface IndicatorSettingsModalProps {
  indicator: SelectedIndicator | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: SelectedIndicator) => void;
}

const PRESET_COLORS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#eab308', // Yellow
  '#64748b', // Slate
  '#ffffff', // White
];

export function IndicatorSettingsModal({
  indicator,
  isOpen,
  onClose,
  onSave,
}: IndicatorSettingsModalProps) {
  const [period, setPeriod] = useState<number>(20);
  const [color, setColor] = useState<string>('#f59e0b');
  const [fastPeriod, setFastPeriod] = useState<number>(12);
  const [slowPeriod, setSlowPeriod] = useState<number>(26);
  const [signalPeriod, setSignalPeriod] = useState<number>(9);
  const [multiplier, setMultiplier] = useState<number>(2);
  const [oversold, setOversold] = useState<number>(30);
  const [overbought, setOverbought] = useState<number>(70);

  useEffect(() => {
    if (indicator) {
      setPeriod(indicator.period ?? 20);
      setColor(indicator.color ?? '#f59e0b');
      setFastPeriod(indicator.fastPeriod ?? 12);
      setSlowPeriod(indicator.slowPeriod ?? 26);
      setSignalPeriod(indicator.signalPeriod ?? 9);
      setMultiplier(indicator.multiplier ?? 2);
      setOversold(indicator.oversold ?? 30);
      setOverbought(indicator.overbought ?? 70);
    }
  }, [indicator]);

  if (!isOpen || !indicator) return null;

  const lower = (indicator.type || indicator.name).toLowerCase();
  const isSma = lower.includes('sma') || lower.includes('simple moving average');
  const isEma = lower.includes('ema') || lower.includes('exponential');
  const isBb = lower.includes('bollinger');
  const isRsi = lower.includes('rsi');
  const isMacd = lower.includes('macd');
  const isAtr = lower.includes('atr') || lower.includes('average true range');

  const handleSave = () => {
    let displayName = indicator.name;
    if (isSma) displayName = `SMA (${period})`;
    else if (isEma) displayName = `EMA (${period})`;
    else if (isBb) displayName = `BB (${period}, ${multiplier})`;
    else if (isRsi) displayName = `RSI (${period})`;
    else if (isMacd) displayName = `MACD (${fastPeriod}, ${slowPeriod}, ${signalPeriod})`;
    else if (isAtr) displayName = `ATR (${period})`;

    onSave({
      ...indicator,
      name: displayName,
      period,
      color,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      multiplier,
      oversold,
      overbought,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-[360px] max-w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {indicator.name} Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Period/Length for SMA, EMA, BB, RSI, ATR */}
          {(isSma || isEma || isBb || isRsi || isAtr) && (
            <label className="flex items-center justify-between gap-4">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {isSma || isEma ? 'Length / Period' : 'Period'}
              </span>
              <input
                type="number"
                min={1}
                max={500}
                value={period}
                onChange={(e) => setPeriod(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-gray-100 text-right focus:outline-none focus:border-blue-500"
              />
            </label>
          )}

          {/* Quick presets for SMA / EMA */}
          {(isSma || isEma) && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-gray-400 mr-1">Presets:</span>
              {[9, 20, 50, 100, 200].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    period === p
                      ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 text-blue-600 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-750 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Bollinger multiplier */}
          {isBb && (
            <label className="flex items-center justify-between gap-4">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                StdDev Multiplier
              </span>
              <input
                type="number"
                step="0.1"
                min={0.5}
                max={5}
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value) || 2)}
                className="w-24 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-gray-100 text-right focus:outline-none focus:border-blue-500"
              />
            </label>
          )}

          {/* MACD Parameters */}
          {isMacd && (
            <>
              <label className="flex items-center justify-between gap-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Fast EMA Length
                </span>
                <input
                  type="number"
                  min={1}
                  value={fastPeriod}
                  onChange={(e) => setFastPeriod(parseInt(e.target.value) || 12)}
                  className="w-24 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-gray-100 text-right"
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Slow EMA Length
                </span>
                <input
                  type="number"
                  min={1}
                  value={slowPeriod}
                  onChange={(e) => setSlowPeriod(parseInt(e.target.value) || 26)}
                  className="w-24 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-gray-100 text-right"
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Signal Smoothing
                </span>
                <input
                  type="number"
                  min={1}
                  value={signalPeriod}
                  onChange={(e) => setSignalPeriod(parseInt(e.target.value) || 9)}
                  className="w-24 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-gray-100 text-right"
                />
              </label>
            </>
          )}

          {/* RSI Thresholds */}
          {isRsi && (
            <>
              <label className="flex items-center justify-between gap-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Oversold Level
                </span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={oversold}
                  onChange={(e) => setOversold(parseInt(e.target.value) || 30)}
                  className="w-24 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-gray-100 text-right"
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Overbought Level
                </span>
                <input
                  type="number"
                  min={50}
                  max={99}
                  value={overbought}
                  onChange={(e) => setOverbought(parseInt(e.target.value) || 70)}
                  className="w-24 px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-750 text-gray-900 dark:text-gray-100 text-right"
                />
              </label>
            </>
          )}

          {/* Color Selection */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Line Color
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="size-6 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 shadow-xs transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {color === c && (
                    <Check className={`size-3.5 ${c === '#ffffff' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="size-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                title="Custom color"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
