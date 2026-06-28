import { useEffect, useRef, useState } from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import {
  TopToolbar,
  ChartHeader,
  SelectedIndicator,
  SelectedStrategy,
} from './components/Toolbar';
import { TradingChart } from './components/TradingChart';
import { Watchlist } from './components/Watchlist';
import { TimeframeBar } from './components/TimeframeBar';
import { StrategyBar } from './components/StrategyBar';
import { OHLCVProvider } from './components/OHLCVContext';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function App() {
  const [selectedIndicators, setSelectedIndicators] = useState<SelectedIndicator[]>([]);
  const [hiddenIndicators, setHiddenIndicators] = useState<Set<string>>(new Set());
  const [allIndicatorsHidden, setAllIndicatorsHidden] = useState(false);

  const [selectedStrategies, setSelectedStrategies] = useState<SelectedStrategy[]>([]);
  const [hiddenStrategies, setHiddenStrategies] = useState<Set<string>>(new Set());
  const [allStrategiesHidden, setAllStrategiesHidden] = useState(false);
  const strategyPanelRef = useRef<ImperativePanelHandle>(null);
  const strategyPanelCollapsedRef = useRef(false);

  // Collapse the strategy panel by default until a strategy is added.
  useEffect(() => {
    if (!strategyPanelRef.current) return;
    if (selectedStrategies.length === 0 && !strategyPanelCollapsedRef.current) {
      strategyPanelRef.current.collapse();
      strategyPanelCollapsedRef.current = true;
    }
  }, [selectedStrategies.length]);

  const handleSelectIndicator = (ind: SelectedIndicator) => {
    setSelectedIndicators((prev) => {
      if (prev.some((i) => i.name === ind.name)) return prev;
      return [...prev, { name: ind.name, badge: ind.badge }];
    });
  };

  const handleSelectStrategy = (strat: SelectedStrategy) => {
    setSelectedStrategies((prev) => {
      if (prev.some((s) => s.name === strat.name)) return prev;
      // First strategy added → expand the (collapsed) strategy panel.
      if (prev.length === 0 && strategyPanelRef.current) {
        strategyPanelRef.current.expand();
        strategyPanelCollapsedRef.current = false;
      }
      return [...prev, { name: strat.name, badge: strat.badge }];
    });
  };

  const handleRemoveIndicator = (name: string) => {
    setSelectedIndicators((prev) => prev.filter((i) => i.name !== name));
    setHiddenIndicators((prev) => {
      if (!prev.has(name)) return prev;
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const handleRemoveStrategy = (name: string) => {
    setSelectedStrategies((prev) => prev.filter((s) => s.name !== name));
    setHiddenStrategies((prev) => {
      if (!prev.has(name)) return prev;
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const handleToggleIndicatorVisibility = (name: string) => {
    setHiddenIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleToggleStrategyVisibility = (name: string) => {
    setHiddenStrategies((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleToggleAllIndicators = () => setAllIndicatorsHidden((prev) => !prev);
  const handleToggleAllStrategies = () => {
    setAllStrategiesHidden((prev) => {
      const next = !prev;
      // Auto-collapse the strategy panel when hiding, restore when unhiding.
      if (strategyPanelRef.current) {
        if (next) {
          strategyPanelRef.current.collapse();
          strategyPanelCollapsedRef.current = true;
        } else {
          strategyPanelRef.current.expand();
          strategyPanelCollapsedRef.current = false;
        }
      }
      return next;
    });
  };

  const effectiveHiddenIndicators = allIndicatorsHidden
    ? new Set(selectedIndicators.map((i) => i.name))
    : hiddenIndicators;
  const effectiveHiddenStrategies = allStrategiesHidden
    ? new Set(selectedStrategies.map((s) => s.name))
    : hiddenStrategies;

  return (
    <OHLCVProvider>
      <div className="size-full flex flex-col bg-gray-50">
        <TopToolbar
          onSelectIndicator={handleSelectIndicator}
          onSelectStrategy={handleSelectStrategy}
        />

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={75} minSize={20}>
              <div className="h-full flex flex-col">
                <ChartHeader />
                <div className="flex-1 min-h-0 flex flex-col">
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={80} minSize={30}>
                      <div className="h-full">
                        <TradingChart
                          selectedIndicators={selectedIndicators}
                          hiddenIndicators={effectiveHiddenIndicators}
                          onToggleIndicatorVisibility={handleToggleIndicatorVisibility}
                          onRemoveIndicator={handleRemoveIndicator}
                          allIndicatorsHidden={allIndicatorsHidden}
                          onToggleAllIndicators={handleToggleAllIndicators}
                          selectedStrategies={selectedStrategies}
                          hiddenStrategies={effectiveHiddenStrategies}
                          onToggleStrategyVisibility={handleToggleStrategyVisibility}
                          onRemoveStrategy={handleRemoveStrategy}
                          allStrategiesHidden={allStrategiesHidden}
                          onToggleAllStrategies={handleToggleAllStrategies}
                        />
                      </div>
                    </Panel>

                    <PanelResizeHandle className="h-1 bg-gray-200 hover:bg-blue-400 cursor-row-resize transition-colors" />

                    <Panel
                      ref={strategyPanelRef}
                      defaultSize={13}
                      minSize={8}
                      collapsible
                      collapsedSize={6}
                    >
                      <div className="h-full flex flex-col bg-white border-t border-gray-200">
                        <TimeframeBar />
                        {selectedStrategies.filter(
                          (s) => !allStrategiesHidden && !hiddenStrategies.has(s.name)
                        ).length > 0 && (
                          <div className="flex-1 min-h-0 overflow-auto">
                            <StrategyBar
                              strategies={selectedStrategies.filter(
                                (s) => !allStrategiesHidden && !hiddenStrategies.has(s.name)
                              )}
                              onRemove={handleRemoveStrategy}
                            />
                          </div>
                        )}
                      </div>
                    </Panel>
                  </PanelGroup>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors" />

            <Panel defaultSize={20} minSize={0} collapsible={true}>
              <div className="h-full overflow-y-auto">
                <Watchlist />
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </OHLCVProvider>
  );
}
