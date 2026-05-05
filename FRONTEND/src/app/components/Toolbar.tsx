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
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            P
          </div>
          <span className="font-semibold">USD/JPY</span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Star className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1 text-sm hover:bg-gray-100 rounded">1m</button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>

        <button className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded text-sm">
          <BarChart2 className="w-4 h-4" />
          Indicators
        </button>

        <button className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded text-sm">
          <Bell className="w-4 h-4" />
          Alert
        </button>

        <button className="flex items-center gap-2 px-3 py-1 hover:bg-gray-100 rounded text-sm">
          <RotateCcw className="w-4 h-4" />
          Replay
        </button>

        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-100 rounded">
            <Undo className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Redo className="w-4 h-4" />
          </button>
        </div>
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
  );
}

export function ChartHeader() {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">🇺🇸 U.S. Dollar / Japanese Yen • 1 • FXCM</span>
        <span className="text-sm">🟰</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-red-600">O 158.771</span>
        <span className="text-red-600">H 158.774</span>
        <span className="text-red-600">L 158.746</span>
        <span className="text-red-600">C 158.749</span>
        <span className="text-red-600">-0.022 (-0.01%)</span>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm bg-red-50">
          158.750 SELL
        </button>
        <span className="text-xs text-gray-500">0.1</span>
        <button className="px-3 py-1 border border-blue-300 text-blue-600 rounded text-sm bg-blue-50">
          158.751 BUY
        </button>
      </div>
      <div className="flex items-center gap-1 text-xs">
        <span className="text-gray-600">▲</span>
        <span className="text-red-600">Vol</span>
        <span className="text-red-600">138</span>
      </div>
    </div>
  );
}
