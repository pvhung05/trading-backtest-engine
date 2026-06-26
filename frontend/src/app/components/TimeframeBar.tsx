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
    <div className="h-8 bg-white border-t border-gray-200 px-2 flex items-center justify-between text-xs select-none">
      <div className="flex items-center">
        {TIMEFRAMES.map((tf) => {
          const isActive = active === tf;
          return (
            <button
              key={tf}
              onClick={() => handleClick(tf)}
              className={`px-2.5 h-8 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tf}
            </button>
          );
        })}
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          className="size-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Go to date"
        >
          <CalendarClock className="size-4" />
        </button>
      </div>
      <div className="text-gray-500 font-mono pr-1 tabular-nums">{time} UTC</div>
    </div>
  );
}
