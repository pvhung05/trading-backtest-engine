import { TopToolbar, ChartHeader } from './components/Toolbar';
import { TradingChart } from './components/TradingChart';
import { Watchlist } from './components/Watchlist';
import { TimeframeBar } from './components/TimeframeBar';
import { OHLCVProvider } from './components/OHLCVContext';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function App() {
  return (
    <OHLCVProvider>
      <div className="size-full flex flex-col bg-gray-50">
        <TopToolbar />

        <div className="flex-1 flex overflow-hidden">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={75} minSize={20}>
              <div className="h-full flex flex-col">
                <ChartHeader />
                <div className="flex-1">
                  <TradingChart />
                </div>
                <TimeframeBar />
              </div>
            </Panel>

            <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors" />

            <Panel defaultSize={25} minSize={0} maxSize={60} collapsible={true}>
              <PanelGroup direction="vertical" className="min-w-0">
                <Panel defaultSize={100} minSize={0} collapsible={true}>
                  <div className="h-full overflow-y-auto">
                    <Watchlist />
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </OHLCVProvider>
  );
}
