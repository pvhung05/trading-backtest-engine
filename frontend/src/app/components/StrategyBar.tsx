import { useEffect, useRef, useState } from 'react';
import { ChevronUp, Maximize2, X, Circle } from 'lucide-react';

export interface ActiveStrategy {
  name: string;
  badge?: 'NEW' | 'BETA';
}

interface StrategyBarProps {
  strategies: ActiveStrategy[];
  onRemove?: (name: string) => void;
}

export function StrategyBar({ strategies, onRemove }: StrategyBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Only intercept vertical wheel inside the tab strip → scroll horizontally.
      // Trackpad users get native horizontal deltaX, so let it pass.
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (strategies.length === 0) return null;

  return (
    <div className="h-9 flex items-end bg-gray-100 select-none">
      <div
        ref={tabsScrollRef}
        className="flex items-end min-w-0 flex-1 overflow-x-auto overflow-y-hidden strategy-tabs-scroll"
      >
        <div className="w-px h-5 bg-gray-300 shrink-0 mb-1.5" />
        {strategies.map((s) => (
          <div
            key={s.name}
            className="group flex items-center gap-2 h-9 pl-3 pr-2 bg-white border-t border-l border-r border-gray-200 rounded-t-md -mb-px cursor-default shrink-0"
            style={{
              // Chrome tab shape: slanted sides
              clipPath:
                'polygon(8px 0, calc(100% - 8px) 0, 100% 100%, 0 100%)',
              paddingLeft: '14px',
              paddingRight: '14px',
            }}
          >
            <Circle className="size-2 fill-blue-500 text-blue-500 shrink-0" />
            <span className="text-xs font-medium text-gray-800 whitespace-nowrap">
              {s.name}
            </span>
            {s.badge && (
              <span
                className={`text-[9px] font-semibold uppercase px-1 py-0.5 rounded shrink-0 ${
                  s.badge === 'NEW'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-purple-100 text-purple-600'
                }`}
              >
                {s.badge}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(s.name);
              }}
              className="size-5 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded shrink-0"
              title="Close strategy"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 shrink-0 px-2 pb-1">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="size-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title={collapsed ? 'Expand strategy list' : 'Collapse strategy list'}
        >
          <ChevronUp
            className={`size-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          className="size-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
          title="Open strategy panel"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}