import { useEffect, useRef, useState } from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { TopToolbar, ChartHeader } from './components/toolbar';
import { TradingChart, TimeframeBar } from './components/chart';
import { StrategyBar } from './components/strategy';
import { Watchlist } from './components/market';
import { LoginPage } from './components/auth';
import { ErrorBoundary } from './components/common';

import { ThemeProvider, AuthProvider, OHLCVProvider, useAuth, useOHLCV } from './context';
import type { SelectedIndicator, SelectedStrategy } from './types';
import { getItem, setItem } from './utils';

export type PersistedTimeframe = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'All';

interface PersistedAppState {
  selectedIndicators: SelectedIndicator[];
  selectedStrategies: SelectedStrategy[];
  activeView: 'metrics' | 'history' | 'period' | 'capital';
  activeTimeframe: PersistedTimeframe;
  dateRange: [string, string];
  capital: number;
  chartHidden: boolean;
}

const DEFAULT_APP_STATE: PersistedAppState = {
  selectedIndicators: [{ id: 'sma-default', name: 'SMA (20)', type: 'SMA', period: 20, color: '#f59e0b' }],
  selectedStrategies: [{ name: 'SMA Cross Strategy', badge: 'NEW' }],
  activeView: 'metrics',
  activeTimeframe: '1D',
  dateRange: ['2024-01-01', '2024-06-01'],
  capital: 10_000,
  chartHidden: false,
};

const STORAGE_KEY = 'trading-app-state';

function loadAppState(): PersistedAppState {
  const saved = getItem<PersistedAppState>(STORAGE_KEY);
  if (!saved) return DEFAULT_APP_STATE;
  return {
    selectedIndicators: Array.isArray(saved.selectedIndicators)
      ? saved.selectedIndicators
      : DEFAULT_APP_STATE.selectedIndicators,
    selectedStrategies: Array.isArray(saved.selectedStrategies)
      ? saved.selectedStrategies
      : DEFAULT_APP_STATE.selectedStrategies,
    activeView: saved.activeView || DEFAULT_APP_STATE.activeView,
    activeTimeframe: saved.activeTimeframe || DEFAULT_APP_STATE.activeTimeframe,
    dateRange: Array.isArray(saved.dateRange) && saved.dateRange.length === 2
      ? saved.dateRange
      : DEFAULT_APP_STATE.dateRange,
    capital: typeof saved.capital === 'number' ? saved.capital : DEFAULT_APP_STATE.capital,
    chartHidden: typeof saved.chartHidden === 'boolean' ? saved.chartHidden : DEFAULT_APP_STATE.chartHidden,
  };
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Auth gate. Pulls the current user out of `AuthContext`; if there's
 * none, renders the login page *instead of* the trading app. The full
 * `AppShell` is mounted only when authenticated so all the heavy state
 * (panels, localStorage hydration, etc.) starts from a clean slate
 * post-login.
 */
function AppGate() {
  const { user, loading, logout } = useAuth();
  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="size-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating session…</span>
        </div>
      </div>
    );
  }
  if (!user) return <LoginPage />;
  return (
    <OHLCVProvider>
      <AppShell userName={user.name} onLogout={logout} />
    </OHLCVProvider>
  );
}

function AppShell({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const { activeStrategyName, setActiveStrategyName, clearStrategyResult } = useOHLCV();
  const initial = loadAppState();

  const [selectedIndicators, setSelectedIndicators] = useState<SelectedIndicator[]>(
    initial.selectedIndicators
  );
  const [hiddenIndicators, setHiddenIndicators] = useState<Set<string>>(new Set());
  const [allIndicatorsHidden, setAllIndicatorsHidden] = useState(false);

  const [selectedStrategies, setSelectedStrategies] = useState<SelectedStrategy[]>(
    initial.selectedStrategies
  );
  const [hiddenStrategies, setHiddenStrategies] = useState<Set<string>>(new Set());
  const [allStrategiesHidden, setAllStrategiesHidden] = useState(false);
  const strategyPanelRef = useRef<ImperativePanelHandle>(null);
  const strategyPanelCollapsedRef = useRef(false);
  const [strategyExpanded, setStrategyExpanded] = useState(false);
  const [chartHidden, setChartHidden] = useState(initial.chartHidden);
  const chartPanelRef = useRef<ImperativePanelHandle | null>(null);
  const [activeView, setActiveView] = useState<'metrics' | 'history' | 'period' | 'capital'>(
    initial.activeView
  );
  const savedChartSizeRef = useRef<number | null>(null);
  const savedStrategySizeRef = useRef<number | null>(null);

  // TimeframeBar state lifted here so it persists across reloads.
  const [activeTimeframe, setActiveTimeframe] = useState<PersistedTimeframe>(
    initial.activeTimeframe
  );

  // StrategyBar internal state lifted here for persistence.
  const [dateRange, setDateRange] = useState<[string, string]>(initial.dateRange);
  const [capital, setCapital] = useState<number>(initial.capital);

  // Persist all top-level state to localStorage whenever it changes.
  useEffect(() => {
    setItem<PersistedAppState>(STORAGE_KEY, {
      selectedIndicators,
      selectedStrategies,
      activeView,
      activeTimeframe,
      dateRange,
      capital,
      chartHidden,
    });
  }, [selectedIndicators, selectedStrategies, activeView, activeTimeframe, dateRange, capital, chartHidden]);

  // Collapse the strategy panel by default until a strategy is added.
  useEffect(() => {
    if (!strategyPanelRef.current) return;
    if (selectedStrategies.length === 0 && !strategyPanelCollapsedRef.current) {
      strategyPanelRef.current.collapse();
      strategyPanelCollapsedRef.current = true;
    }
  }, [selectedStrategies.length]);

  const handleSelectIndicator = (ind: SelectedIndicator) => {
    if (selectedIndicators.length >= 4) {
      alert('Tối đa 4 chỉ báo kỹ thuật (indicators). Vui lòng xóa bớt chỉ báo cũ trước khi thêm mới.');
      return;
    }

    const lower = ind.name.toLowerCase();
    let baseType = 'SMA';
    let period = 20;
    let color = '#f59e0b';
    let displayName = ind.name;

    if (lower.includes('sma') || lower.includes('simple moving average')) {
      baseType = 'SMA';
      const existingPeriods = selectedIndicators
        .filter((i) => (i.type || i.name).toLowerCase().includes('sma'))
        .map((i) => i.period ?? 20);
      if (existingPeriods.includes(20)) {
        period = existingPeriods.includes(50) ? (existingPeriods.includes(100) ? 200 : 100) : 50;
      } else {
        period = 20;
      }
      displayName = `SMA (${period})`;
      const colors = ['#f59e0b', '#06b6d4', '#10b981', '#ec4899', '#8b5cf6'];
      color = colors[selectedIndicators.length % colors.length];
    } else if (lower.includes('ema') || lower.includes('exponential')) {
      baseType = 'EMA';
      const existingPeriods = selectedIndicators
        .filter((i) => (i.type || i.name).toLowerCase().includes('ema'))
        .map((i) => i.period ?? 20);
      period = existingPeriods.includes(20) ? (existingPeriods.includes(50) ? 200 : 50) : 20;
      displayName = `EMA (${period})`;
      const colors = ['#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
      color = colors[selectedIndicators.length % colors.length];
    } else if (lower.includes('bollinger')) {
      baseType = 'Bollinger';
      period = 20;
      displayName = 'BB (20, 2)';
      color = '#3b82f6';
    } else if (lower.includes('rsi')) {
      baseType = 'RSI';
      period = 14;
      displayName = 'RSI (14)';
      color = '#ec4899';
    } else if (lower.includes('macd')) {
      baseType = 'MACD';
      displayName = 'MACD (12, 26, 9)';
      color = '#3b82f6';
    } else if (lower.includes('atr')) {
      baseType = 'ATR';
      period = 14;
      displayName = 'ATR (14)';
      color = '#10b981';
    }

    const uniqueId = ind.id || `${baseType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    setSelectedIndicators((prev) => [
      ...prev,
      {
        id: uniqueId,
        name: displayName,
        type: baseType,
        period,
        color,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        multiplier: 2,
        oversold: 30,
        overbought: 70,
        badge: ind.badge,
      },
    ]);
  };

  const handleUpdateIndicator = (updated: SelectedIndicator) => {
    setSelectedIndicators((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
  };

  const handleSelectStrategy = (strat: SelectedStrategy) => {
    setSelectedStrategies((prev) => {
      if (prev.some((s) => s.name === strat.name)) return prev;
      if (prev.length === 0 && strategyPanelRef.current) {
        strategyPanelRef.current.expand();
        strategyPanelCollapsedRef.current = false;
      }
      return [...prev, { name: strat.name, badge: strat.badge }];
    });
  };

  const handleRemoveIndicator = (idOrName: string) => {
    setSelectedIndicators((prev) => prev.filter((i) => i.id !== idOrName && i.name !== idOrName));
    setHiddenIndicators((prev) => {
      if (!prev.has(idOrName)) return prev;
      const next = new Set(prev);
      next.delete(idOrName);
      return next;
    });
  };

  const handleRemoveStrategy = (name: string) => {
    setSelectedStrategies((prev) => {
      const next = prev.filter((s) => s.name !== name);
      if (next.length === 0) {
        if (strategyPanelRef.current) {
          strategyPanelRef.current.collapse();
          strategyPanelCollapsedRef.current = true;
        }
        setStrategyExpanded(false);
        chartPanelRef.current?.expand();
        setChartHidden(false);
        setActiveStrategyName(null);
      } else if (activeStrategyName === name) {
        setActiveStrategyName(next[0].name);
      }
      return next;
    });

    setHiddenStrategies((prev) => {
      if (!prev.has(name)) return prev;
      const next = new Set(prev);
      next.delete(name);
      return next;
    });

    clearStrategyResult(name);
  };

  const handleToggleIndicatorVisibility = (idOrName: string) => {
    setHiddenIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(idOrName)) next.delete(idOrName);
      else next.add(idOrName);
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

  const handleToggleAllIndicators = () => {
    setAllIndicatorsHidden((prev) => !prev);
  };

  const handleToggleAllStrategies = () => {
    setAllStrategiesHidden((prev) => !prev);
  };

  const effectiveHiddenIndicators = allIndicatorsHidden
    ? new Set(selectedIndicators.map((i) => i.id || i.name))
    : hiddenIndicators;

  const effectiveHiddenStrategies = allStrategiesHidden
    ? new Set(selectedStrategies.map((s) => s.name))
    : hiddenStrategies;

  return (
    <div className="size-full flex flex-col bg-gray-50 dark:bg-gray-900 font-sans">
        <TopToolbar
          onSelectIndicator={handleSelectIndicator}
          onSelectStrategy={handleSelectStrategy}
          userName={userName}
          onLogout={onLogout}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <PanelGroup direction="horizontal">
              <Panel defaultSize={82} minSize={50}>
                <div className="h-full flex flex-col bg-white dark:bg-gray-800">
                  <ChartHeader />

                  <div className="flex-1 min-h-0">
                    <PanelGroup direction="vertical">
                      <Panel
                        defaultSize={85}
                        minSize={15}
                        collapsible
                        ref={(handle: ImperativePanelHandle | null) => {
                          chartPanelRef.current = handle;
                        }}
                        onCollapse={() => setChartHidden(true)}
                      >
                        <div className="h-full">
                          <ErrorBoundary fallbackTitle="Chart Error">
                            <TradingChart
                              selectedIndicators={selectedIndicators}
                              hiddenIndicators={effectiveHiddenIndicators}
                              onToggleIndicatorVisibility={handleToggleIndicatorVisibility}
                              onRemoveIndicator={handleRemoveIndicator}
                              onUpdateIndicator={handleUpdateIndicator}
                              allIndicatorsHidden={allIndicatorsHidden}
                              onToggleAllIndicators={handleToggleAllIndicators}
                              selectedStrategies={selectedStrategies}
                              hiddenStrategies={effectiveHiddenStrategies}
                              onToggleStrategyVisibility={handleToggleStrategyVisibility}
                              onRemoveStrategy={handleRemoveStrategy}
                              allStrategiesHidden={allStrategiesHidden}
                              onToggleAllStrategies={handleToggleAllStrategies}
                            />
                          </ErrorBoundary>
                        </div>
                      </Panel>

                      <PanelResizeHandle className="h-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-row-resize transition-colors" />

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
                          setStrategyExpanded(size > 30);
                        }}
                      >
                        <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                          {!chartHidden && (
                            <TimeframeBar
                              value={activeTimeframe}
                              onChange={setActiveTimeframe}
                            />
                          )}
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
                                initialDateRange={dateRange}
                                initialCapital={capital}
                                onDateRangeChange={setDateRange}
                                onCapitalChange={setCapital}
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
                                  const chartPanel = chartPanelRef.current;
                                  const stratPanel = strategyPanelRef.current;
                                  if (chartPanel && stratPanel) {
                                    savedChartSizeRef.current = chartPanel.getSize();
                                    savedStrategySizeRef.current = stratPanel.getSize();
                                    chartPanel.collapse();
                                    setChartHidden(true);
                                    stratPanel.resize(100);
                                    setStrategyExpanded(true);
                                  }
                                }}
                                onRestorePanel={() => {
                                  const chartPanel = chartPanelRef.current;
                                  const stratPanel = strategyPanelRef.current;
                                  if (chartPanel && stratPanel) {
                                    chartPanel.expand();
                                    setChartHidden(false);
                                    const stratTarget = savedStrategySizeRef.current ?? 30;
                                    stratPanel.resize(stratTarget);
                                    setStrategyExpanded(stratTarget > 30);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </Panel>
                    </PanelGroup>
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 active:bg-blue-600 dark:hover:bg-blue-500 dark:active:bg-blue-600 cursor-col-resize transition-colors relative after:absolute after:inset-y-0 after:-left-1.5 after:-right-1.5 after:z-30" />

              <Panel defaultSize={18} minSize={0} maxSize={40} collapsible>
                <ErrorBoundary fallbackTitle="Watchlist Error">
                  <Watchlist />
                </ErrorBoundary>
              </Panel>
            </PanelGroup>
          </div>
        </div>
      </div>
  );
}
