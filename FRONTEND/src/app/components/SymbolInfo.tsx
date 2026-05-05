import { Grid3x3, Share2, MoreHorizontal } from 'lucide-react';

export function SymbolInfo() {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs">
            🇺🇸
          </div>
          <span className="font-semibold">USDJPY</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-100 rounded">
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-600 mb-1">U.S. Dollar / Japanese Yen ↗ • FXCM</div>
        <div className="text-xs text-gray-600">Forex</div>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold mb-1">
          158.749<span className="text-sm text-gray-600 ml-1">JPY</span>
        </div>
        <div className="text-sm text-green-600">+0.162 +0.10%</div>
        <div className="text-xs text-gray-600 mt-1">● Market open</div>
      </div>

      <div className="mb-4 p-3 bg-purple-50 rounded">
        <div className="flex items-start gap-2">
          <div className="text-purple-600 mt-1">⚡</div>
          <div className="flex-1 text-xs">
            <span className="font-medium">2 hours ago</span>
            <span className="text-gray-600"> - Dollar fluctuates around one-week high as US-Iran tensions...</span>
          </div>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-3">Performance</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">6M</div>
            <div className="text-sm text-red-600">-0.53%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">YTD</div>
            <div className="text-sm text-green-600">0.68%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">1Y</div>
            <div className="text-sm text-green-600">0.40%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1"></div>
            <div className="text-sm"></div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1"></div>
            <div className="text-sm text-green-600 bg-green-100 py-2 rounded">4.50%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1"></div>
            <div className="text-sm"></div>
          </div>
          <div className="text-center"></div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">1.22%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1"></div>
            <div className="text-sm text-green-600 bg-green-100 py-2 rounded">11.48%</div>
          </div>
        </div>
        <div className="text-xs text-right text-gray-600 mt-2">14:17:39 UTC</div>
      </div>
    </div>
  );
}
