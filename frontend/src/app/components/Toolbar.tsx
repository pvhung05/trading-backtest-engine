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
  RotateCcw,
  Undo,
  Redo,
  Image,
  Settings,
  Camera,
  Star,
  Heart,
  Flag
} from 'lucide-react';
import { useState } from 'react';
import { IntervalDropdown } from './IntervalDropdown';
import { IndicatorsDialog } from './IndicatorsDialog';
import { useOHLCV } from './OHLCVContext';

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
    <div className="bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1 w-12">
      {tools.map((tool, index) => (
        <button
          key={index}
          className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
          title={tool.label}
        >
          <tool.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

export function TopToolbar() {
  const [interval, setInterval] = useState('1d');
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);
  const { symbol } = useOHLCV();

  return (
    <>
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            ₿
          </div>
          <span className="font-semibold">{symbol}</span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Star className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <IntervalDropdown value={interval} onChange={setInterval} />

        <button
          onClick={() => setIndicatorsOpen(true)}
          className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded text-sm"
        >
          <BarChart2 className="w-4 h-4" />
          Indicators
        </button>

        <button className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded text-sm">
          <RotateCcw className="w-4 h-4" />
          Replay
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="px-3 py-1 hover:bg-gray-100 rounded text-sm">Unnamed</button>
        <button className="p-1 hover:bg-gray-100 rounded">
          <Settings className="w-4 h-4" />
        </button>
        <button className="p-1 hover:bg-gray-100 rounded">
          <Image className="w-4 h-4" />
        </button>
        <button className="p-1 hover:bg-gray-100 rounded">
          <Camera className="w-4 h-4" />
        </button>
        <button className="px-4 py-1.5 text-sm hover:bg-gray-100 rounded">Trade</button>
        <button className="px-4 py-1.5 bg-black text-white rounded text-sm hover:bg-gray-800">
          Publish
        </button>
      </div>
    </div>

    <IndicatorsDialog
      open={indicatorsOpen}
      onClose={() => setIndicatorsOpen(false)}
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
  const colorClass = isGreen ? 'text-green-600' : 'text-gray-900';

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-1.5 flex items-center gap-4 text-xs select-none overflow-x-auto">
      {/* Symbol info */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
          ₿
        </div>
        <span className="font-medium text-gray-900">{symbol}</span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-gray-300 shrink-0" />

      {/* OHLCV */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">O</span>
          <span className="font-medium text-gray-800 tabular-nums">{fmt(data.open)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">H</span>
          <span className="font-medium text-green-600 tabular-nums">{fmt(data.high)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">L</span>
          <span className="font-medium text-red-600 tabular-nums">{fmt(data.low)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">C</span>
          <span className={`font-medium tabular-nums ${colorClass}`}>{fmt(data.close)}</span>
        </div>
      </div>
    </div>
  );
}
