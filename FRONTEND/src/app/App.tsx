import { LeftToolbar, TopToolbar, ChartHeader } from './components/Toolbar';
import { TradingChart } from './components/TradingChart';
import { Watchlist } from './components/Watchlist';
import { SymbolInfo } from './components/SymbolInfo';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function App() {
  return (
    <div className="size-full flex flex-col bg-gray-50">
      <TopToolbar />

      <div className="flex-1 flex overflow-hidden">
        <LeftToolbar />

        <PanelGroup direction="horizontal">
          <Panel defaultSize={75} minSize={20}>
            <div className="h-full flex flex-col">
              <ChartHeader />
              <div className="flex-1">
                <TradingChart />
              </div>
              <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center gap-4 text-xs">
                <button className="hover:bg-gray-100 px-2 py-1 rounded">1D</button>
                <button className="hover:bg-gray-100 px-2 py-1 rounded">5D</button>
                <button className="hover:bg-gray-100 px-2 py-1 rounded">1M</button>
                <button className="hover:bg-gray-100 px-2 py-1 rounded">3M</button>
                <button className="hover:bg-gray-100 px-2 py-1 rounded">6M</button>
                <button className="hover:bg-gray-100 px-2 py-1 rounded">YTD</button>
                <button className="hover:bg-gray-100 px-2 py-1 rounded">1Y</button>
                <button className="hover:bg-gray-100 px-2 py-1 rounded">5Y</button>
                <button className="hover:bg-gray-100 px-2 py-1 rounded">All</button>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors" />

          <Panel defaultSize={25} minSize={0} maxSize={60} collapsible={true}>
            <PanelGroup direction="vertical" className="min-w-0">
              <Panel defaultSize={60} minSize={0} collapsible={true}>
                <div className="h-full overflow-y-auto">
                  <Watchlist />
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-gray-200 hover:bg-blue-400 cursor-row-resize transition-colors" />

              <Panel defaultSize={40} minSize={0} collapsible={true}>
                <div className="h-full overflow-y-auto">
                  <SymbolInfo />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}