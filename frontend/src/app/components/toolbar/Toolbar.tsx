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
  FileCode,
  Image,
  Settings,
  Camera,
  Star,
  Heart,
  Flag,
  Wand2,
  Code2,
} from 'lucide-react';
import { useState } from 'react';
import { IntervalDropdown } from '../chart/IntervalDropdown';
import { IndicatorsDialog } from '../chart/IndicatorsDialog';
import { UserMenu } from './UserMenu';
import { useOHLCV } from '../../context/OHLCVContext';
import type { SelectedIndicator, SelectedStrategy } from '../../types/indicator.types';

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
    <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-2.5 gap-1 w-12">
      {tools.map((tool, index) => (
        <button
          key={index}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-150 active:scale-95 cursor-pointer"
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
  onOpenPineEditor,
  userName,
  onLogout,
  onOpenCommunity,
}: {
  onSelectIndicator?: (indicator: SelectedIndicator) => void;
  onSelectStrategy?: (strategy: SelectedStrategy) => void;
  onOpenPineEditor?: (script?: { id?: string; title: string; sourceCode: string }) => void;
  userName?: string;
  onLogout?: () => void;
  onOpenCommunity?: () => void;
}) {
  const { interval, setInterval } = useOHLCV();
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);
  const [strategiesOpen, setStrategiesOpen] = useState(false);
  const [myScriptsOpen, setMyScriptsOpen] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {userName ? (
              <>
                <UserMenu userName={userName} onLogout={onLogout} onOpenCommunity={onOpenCommunity} />
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{userName}</span>
              </>
            ) : (
              <button className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-150 active:scale-[0.98] cursor-pointer">
                Sign in
              </button>
            )}
          </div>

          <IntervalDropdown value={interval} onChange={setInterval} />

          <button
            onClick={() => setIndicatorsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 text-blue-500" />
            Indicators
          </button>

          <button
            onClick={() => setStrategiesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-purple-500" />
            Strategies
          </button>

          <button
            onClick={() => setMyScriptsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-emerald-500" />
            My Scripts
          </button>

          <button
            onClick={() => onOpenPineEditor?.()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-blue-500" />
            Pine Editor
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <Image className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <Camera className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
          <button className="px-3.5 py-1.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg border border-gray-200 dark:border-gray-700 shadow-2xs transition-all duration-150 active:scale-[0.98] cursor-pointer">
            Trade
          </button>
          <button className="px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg text-sm hover:bg-black dark:hover:bg-gray-100 shadow-xs hover:shadow transition-all duration-150 active:scale-[0.98] cursor-pointer">
            Publish
          </button>
        </div>
      </div>

      <IndicatorsDialog
        open={indicatorsOpen}
        onClose={() => setIndicatorsOpen(false)}
        onOpenPineEditor={onOpenPineEditor}
        onSelect={(ind) =>
          onSelectIndicator?.({
            id: `ind-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: ind.name,
            type: ind.name,
            badge: ind.badge,
          })
        }
      />
      <IndicatorsDialog
        open={strategiesOpen}
        onClose={() => setStrategiesOpen(false)}
        onOpenPineEditor={onOpenPineEditor}
        onSelect={(ind) => onSelectStrategy?.(ind as SelectedStrategy)}
        initialTab="strategies"
      />
      <IndicatorsDialog
        open={myScriptsOpen}
        onClose={() => setMyScriptsOpen(false)}
        onOpenPineEditor={onOpenPineEditor}
        onSelect={(ind) =>
          onSelectIndicator?.({
            id: `ind-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: ind.name,
            type: ind.name,
            badge: ind.badge,
          })
        }
        initialTab="my-scripts"
      />
    </>
  );
}

export function ChartHeader({
  onSelectIndicator,
  onSelectStrategy,
  onOpenPineEditor,
}: {
  onSelectIndicator?: (indicator: SelectedIndicator) => void;
  onSelectStrategy?: (strategy: SelectedStrategy) => void;
  onOpenPineEditor?: (script?: { id?: string; title: string; sourceCode: string }) => void;
}) {
  const { data, symbol, interval, setInterval } = useOHLCV();
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);

  const isUp = !data.change?.startsWith('-');
  const changeColor = isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 flex items-center gap-3 text-xs select-none relative z-20 text-gray-700 dark:text-gray-300 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 bg-gradient-to-tr from-amber-500 to-orange-400 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-2xs">
            ₿
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{symbol}</span>
        </div>

        <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-700 shrink-0" />

        <div className="shrink-0">
          <IntervalDropdown value={interval} onChange={setInterval} />
        </div>

        <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-700 shrink-0" />

        <button
          onClick={() => setIndicatorsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0"
        >
          <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Indicators</span>
        </button>

        <button
          onClick={() => onOpenPineEditor?.()}
          className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md text-xs font-medium text-blue-600 dark:text-blue-400 transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Code2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Pine Editor</span>
        </button>

        <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-700 shrink-0" />

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-gray-500 font-medium">O</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums">{data.open || '—'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-gray-500 font-medium">H</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{data.high || '—'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-gray-500 font-medium">L</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">{data.low || '—'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-gray-500 font-medium">C</span>
            <span className={`font-semibold tabular-nums ${changeColor}`}>{data.close || '—'}</span>
          </div>
          {data.change && data.change !== '—' && (
            <div className={`flex items-center gap-1 font-semibold tabular-nums ${changeColor}`}>
              <span>{data.change}</span>
              <span>({data.changePct})</span>
            </div>
          )}
        </div>
      </div>

      <IndicatorsDialog
        open={indicatorsOpen}
        onClose={() => setIndicatorsOpen(false)}
        onOpenPineEditor={onOpenPineEditor}
        onSelect={(ind, tab) => {
          if (tab === 'strategies' || ind.strategyType) {
            onSelectStrategy?.({
              name: ind.name,
              badge: ind.badge,
            });
          } else {
            onSelectIndicator?.({
              id: `ind-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: ind.name,
              type: ind.name,
              badge: ind.badge,
            });
          }
        }}
      />
    </>
  );
}
