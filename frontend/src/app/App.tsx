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
  // Track whether the user has expanded the strategy panel so the chevron
  // icon can flip direction. Updates both via button click and manual drag.
  const [strategyExpanded, setStrategyExpanded] = useState(false);
  // When the user maximizes the strategy panel, hide the chart entirely so
  // the strategy view occupies the full vertical space.
  const [chartHidden, setChartHidden] = useState(false);
  const chartPanelRef = useRef<ImperativePanelHandle | null>(null);
  // Track active view tab in strategy panel (metrics/history/period/capital).
  // This state lives here so it's preserved across panel maximize/restore.
  const [activeView, setActiveView] = useState<'metrics' | 'history' | 'period' | 'capital'>('metrics');
  // Capture the panel sizes right before the chart is hidden, so we can
  // restore them faithfully when the user re-opens the chart via the
  // minimize button (otherwise the chart panel snaps back to its
  // `defaultSize` and the layout becomes awkward to drag again).
  const savedChartSizeRef = useRef<number | null>(null);
  const savedStrategySizeRef = useRef<number | null>(null);

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
                {!chartHidden && <ChartHeader />}
                <div className="flex-1 min-h-0 flex flex-col">
                  {chartHidden ? (
                    /* When the chart is hidden we render the strategy
                       panel directly at 100% height. Wrapping a single
                       child inside a PanelGroup makes react-resizable-
                       panels warn that the layout total is only ~15%,
                       which is noisy even though it's harmless.
                       The `key` forces a fresh JSX subtree (and ref)
                       each time we toggle chart visibility — otherwise
                       the old panel's internals linger and the drag
                       direction gets inverted. */
                    <div key="strategy-standalone" className="h-full flex flex-col bg-white border-t border-gray-200">
                      <StrategyBar
                            strategies={selectedStrategies.filter(
                              (s) => !allStrategiesHidden && !hiddenStrategies.has(s.name)
                            )}
                            onRemove={handleRemoveStrategy}
                            expanded={strategyExpanded}
                            chartHidden={chartHidden}
                            activeView={activeView}
                            onActiveViewChange={setActiveView}
                            onCollapsePanel={() => {
                              strategyPanelRef.current?.resize(10);
                              setStrategyExpanded(false);
                              setChartHidden(false);
                            }}
                            onExpandPanel={() => {
                              const panel = strategyPanelRef.current;
                              if (!panel) return;
                              panel.resize(85);
                              setStrategyExpanded(true);
                            }}
                            onMaximizePanel={() => {
                              setChartHidden(true);
                              setStrategyExpanded(true);
                            }}
                            onRestorePanel={() => {
                              setChartHidden(false);
                              setStrategyExpanded(false);
                            }}
                          />
                    </div>
                  ) : (
                    <PanelGroup direction="vertical">
                      <Panel
                        defaultSize={85}
                        minSize={30}
                        collapsible
                        ref={(handle: ImperativePanelHandle | null) => {
                          chartPanelRef.current = handle;
                        }}
                        onCollapse={() => setChartHidden(true)}
                      >
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
                        defaultSize={12}
                        minSize={12}
                        maxSize={85}
                        collapsible
                        collapsedSize={7}
                        onCollapse={() => setStrategyExpanded(false)}
                        onExpand={() => setStrategyExpanded(false)}
                        onResize={(size) => {
                          // Flip the chevron icon when the user manually
                          // drags the handle. Anything well above the
                          // default size (15%) counts as "expanded".
                          setStrategyExpanded(size > 30);
                        }}
                      >
                        <div className="h-full flex flex-col bg-white border-t border-gray-200">
                          {!chartHidden && <TimeframeBar />}
                          {selectedStrategies.filter(
                            (s) => !allStrategiesHidden && !hiddenStrategies.has(s.name)
                          ).length > 0 && (
                            <div className="flex-1 min-h-0 overflow-hidden">
                              <StrategyBar
                                strategies={selectedStrategies.filter(
                                  (s) => !allStrategiesHidden && !hiddenStrategies.has(s.name)
                                )}
                                onRemove={handleRemoveStrategy}
                                expanded={strategyExpanded}
                                chartHidden={chartHidden}
                                activeView={activeView}
                                onActiveViewChange={setActiveView}
                                onCollapsePanel={() => {
                                  strategyPanelRef.current?.resize(10);
                                  setStrategyExpanded(false);
                                  setChartHidden(false);
                                }}
                                onExpandPanel={() => {
                                  const panel = strategyPanelRef.current;
                                  if (!panel) return;
                                  panel.resize(85);
                                  setStrategyExpanded(true);
                                }}
                                onMaximizePanel={() => {
                                  const panel = strategyPanelRef.current;
                                  if (!panel) return;
                                  savedChartSizeRef.current =
                                    chartPanelRef.current?.getSize() ?? null;
                                  savedStrategySizeRef.current = panel.getSize();
                                  panel.resize(85);
                                  setStrategyExpanded(true);
                                  setChartHidden(true);
                                }}
                                onRestorePanel={() => {
                                  setChartHidden(false);
                                  setStrategyExpanded(false);
                                  const strategySize =
                                    savedStrategySizeRef.current ?? 15;
                                  window.setTimeout(() => {
                                    const panel = strategyPanelRef.current;
                                    if (!panel) return;
                                    if (panel.isCollapsed()) {
                                      panel.expand();
                                    }
                                    panel.resize(strategySize);
                                  }, 0);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </Panel>
                    </PanelGroup>
                  )}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors" />

            <Panel defaultSize={25} minSize={0} maxSize={25} collapsible={true}>
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
