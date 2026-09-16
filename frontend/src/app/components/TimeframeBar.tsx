import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';

const TIMEFRAMES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

interface TimeframeBarProps {
  value?: Timeframe;
  onChange?: (tf: Timeframe) => void;
}

export function TimeframeBar({ value = '1D', onChange }: TimeframeBarProps) {
  const [active, setActive] = useState<Timeframe>(value);

  // Sync with external changes (e.g. on reload the parent restores the saved value).
  useEffect(() => {
    setActive(value);
  }, [value]);
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      const ss = String(now.getUTCSeconds()).padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleClick = (tf: Timeframe) => {
    setActive(tf);
    onChange?.(tf);
  };

  return (
    <div className="h-9 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2.5 flex items-center justify-between text-xs select-none text-gray-700 dark:text-gray-300 shadow-2xs">
      <div className="flex items-center gap-0.5">
        {TIMEFRAMES.map((tf) => {
          const isActive = active === tf;
          return (
            <button
              key={tf}
              onClick={() => handleClick(tf)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all duration-150 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/60 font-medium'
              }`}
            >
              {tf}
            </button>
          );
        })}
        <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button
          className="size-7 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer"
          title="Go to date"
        >
          <CalendarClock className="size-3.5" />
        </button>
      </div>
      <div className="text-gray-400 dark:text-gray-500 font-mono text-[11px] pr-1 tabular-nums font-medium">{time} UTC</div>
    </div>
  );
}
