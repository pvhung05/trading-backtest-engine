import {
  TrendingUp,
  Circle,
  Square,
  Minus,
  Type,
  Smile,
  Edit3,
  ZoomIn,
  Plus,
  BarChart2,
  Bell,
  FileCode,
  Undo,
  Redo,
  Image,
  Settings,
  Camera,
  Star,
  Heart,
  Flag,
  Wand2,
} from 'lucide-react';
import { useState } from 'react';
import { IntervalDropdown } from './IntervalDropdown';
import { IndicatorsDialog } from './IndicatorsDialog';
import { UserMenu } from './UserMenu';
import { useOHLCV } from './OHLCVContext';

export interface SelectedIndicator {
  name: string;
  badge?: 'NEW' | 'BETA';
}

export interface SelectedStrategy {
  name: string;
  badge?: 'NEW' | 'BETA';
}

export function LeftToolbar() {
  const tools = [
    { icon: Plus, label: 'Cross' },
    { icon: TrendingUp, label: 'Trend Line' },
    { icon: Minus, label: 'Horizontal Line' },
    { icon: Edit3, label: 'Drawing Tools' },
    { icon: Type, label: 'Text' },
    { icon: Smile, label: 'Emoji' },
    { icon: Edit3, label: 'Brush' },
    { icon: ZoomIn, label: 'Zoom' },
    { icon: Flag, label: 'Flag' },
    { icon: Star, label: 'Star' },
    { icon: Circle, label: 'Circle' },
    { icon: Square, label: 'Rectangle' },
    { icon: Heart, label: 'Favorite' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-3 gap-1 w-12">
      {tools.map((tool, index) => (
        <button
          key={index}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          title={tool.label}
        >
          <tool.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

export function TopToolbar({
  onSelectIndicator,
  onSelectStrategy,
  userName,
  onLogout,
}: {
  onSelectIndicator?: (indicator: SelectedIndicator) => void;
  onSelectStrategy?: (strategy: SelectedStrategy) => void;
  // Display name of the currently logged-in user. Rendered as a small
  // pill near the right edge of the toolbar. Optional so the toolbar
  // remains usable in contexts that don't have an auth context.
  userName?: string;
  onLogout?: () => void;
}) {
  const [interval, setInterval] = useState('1d');
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);
  const [strategiesOpen, setStrategiesOpen] = useState(false);
  const [myScriptsOpen, setMyScriptsOpen] = useState(false);
  const { symbol } = useOHLCV();

  return (
    <>
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {userName ? (
            <>
              <UserMenu userName={userName} onLogout={onLogout} />
              <span className="font-semibold text-gray-900 dark:text-gray-100">{userName}</span>
            </>
          ) : (
            <button className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200">
              Sign in
            </button>
          )}
        </div>

        <IntervalDropdown value={interval} onChange={setInterval} />

        <button
          onClick={() => setIndicatorsOpen(true)}
          className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200"
        >
          <BarChart2 className="w-4 h-4" />
          Indicators
        </button>

        <button
          onClick={() => setStrategiesOpen(true)}
          className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200"
        >
          <Wand2 className="w-4 h-4" />
          Strategies
        </button>

        <button
          onClick={() => setMyScriptsOpen(true)}
          className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200"
        >
          <FileCode className="w-4 h-4" />
          My Scripts
        </button>
      </div>

      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Settings className="w-4 h-4" />
        </button>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Image className="w-4 h-4" />
        </button>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Camera className="w-4 h-4" />
        </button>
        <button className="px-4 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          Trade
        </button>
        <button className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-200">
          Publish
        </button>
      </div>
    </div>

    <IndicatorsDialog
      open={indicatorsOpen}
      onClose={() => setIndicatorsOpen(false)}
      onSelect={(ind) => onSelectIndicator?.(ind)}
    />
    <IndicatorsDialog
      open={strategiesOpen}
      onClose={() => setStrategiesOpen(false)}
      onSelect={(ind) => onSelectStrategy?.(ind as SelectedStrategy)}
      initialTab="strategies"
    />
    <IndicatorsDialog
      open={myScriptsOpen}
      onClose={() => setMyScriptsOpen(false)}
      onSelect={(ind) => onSelectIndicator?.(ind)}
      initialTab="my-scripts"
    />
    </>
  );
}

function fmt(str: string) {
  if (str === '—') return str;
  const v = parseFloat(str);
  return isNaN(v) ? str : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ChartHeader() {
  const { data, symbol } = useOHLCV();

  const close = parseFloat(data.close);
  const isGreen = !isNaN(close) && close >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 flex items-center gap-4 text-xs select-none overflow-x-auto text-gray-700 dark:text-gray-300">
      {/* Symbol info */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
          ₿
        </div>
        <span className="font-medium text-gray-900 dark:text-gray-100">{symbol}</span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 shrink-0" />

      {/* OHLCV */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-gray-400 dark:text-gray-500">O</span>
          <span className="font-medium text-gray-800 dark:text-gray-200 tabular-nums">{fmt(data.open)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 dark:text-gray-500">H</span>
          <span className="font-medium text-green-600 dark:text-green-400 tabular-nums">{fmt(data.high)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 dark:text-gray-500">L</span>
          <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">{fmt(data.low)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 dark:text-gray-500">C</span>
          <span className={`font-medium tabular-nums ${isGreen ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>{fmt(data.close)}</span>
        </div>
      </div>
    </div>
  );
}
