import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { BacktestRunDetailResponse } from '../types/backtest.types';

export interface OHLCVData {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  change: string;
  changePct: string;
  volume: string;
  bid: string;
  ask: string;
  periodChange?: string;
  periodChangePct?: string;
}

export interface OHLCVContextType {
  data: OHLCVData;
  setData: (data: OHLCVData) => void;
  symbol: string;
  setSymbol: (s: string) => void;
  interval: string;
  setInterval: (i: string) => void;
  activeStrategyName: string | null;
  setActiveStrategyName: (name: string | null) => void;
  strategyResults: Record<string, BacktestRunDetailResponse>;
  setBacktestResultForStrategy: (strategyName: string, result: BacktestRunDetailResponse | null) => void;
  clearStrategyResult: (strategyName: string) => void;
  backtestResult: BacktestRunDetailResponse | null;
  setBacktestResult: (result: BacktestRunDetailResponse | null) => void;
  isBacktestRunning: boolean;
  setIsBacktestRunning: (running: boolean) => void;
  selectedTradeTime: number | null;
  setSelectedTradeTime: (timeSec: number | null) => void;
}

const DEFAULT_DATA: OHLCVData = {
  time: '—',
  open: '—',
  high: '—',
  low: '—',
  close: '—',
  change: '—',
  changePct: '—',
  volume: '—',
  bid: '—',
  ask: '—',
  periodChange: '—',
  periodChangePct: '—',
};

const Context = createContext<OHLCVContextType>({
  data: DEFAULT_DATA,
  setData: () => {},
  symbol: 'BTCUSDT',
  setSymbol: () => {},
  interval: '1h',
  setInterval: () => {},
  activeStrategyName: null,
  setActiveStrategyName: () => {},
  strategyResults: {},
  setBacktestResultForStrategy: () => {},
  clearStrategyResult: () => {},
  backtestResult: null,
  setBacktestResult: () => {},
  isBacktestRunning: false,
  setIsBacktestRunning: () => {},
  selectedTradeTime: null,
  setSelectedTradeTime: () => {},
});

export function OHLCVProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OHLCVData>(DEFAULT_DATA);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1h');
  const [activeStrategyName, setActiveStrategyName] = useState<string | null>(null);
  const [strategyResults, setStrategyResults] = useState<Record<string, BacktestRunDetailResponse>>({});
  const [isBacktestRunning, setIsBacktestRunning] = useState<boolean>(false);
  const [selectedTradeTime, setSelectedTradeTime] = useState<number | null>(null);

  const handleSetData = useCallback((newData: OHLCVData) => {
    setData(newData);
  }, []);

  const setBacktestResultForStrategy = useCallback((strategyName: string, result: BacktestRunDetailResponse | null) => {
    setStrategyResults((prev) => {
      if (!result) {
        const next = { ...prev };
        delete next[strategyName];
        return next;
      }
      return { ...prev, [strategyName]: result };
    });
  }, []);

  const clearStrategyResult = useCallback((strategyName: string) => {
    setStrategyResults((prev) => {
      if (!(strategyName in prev)) return prev;
      const next = { ...prev };
      delete next[strategyName];
      return next;
    });
  }, []);

  const setBacktestResult = useCallback((result: BacktestRunDetailResponse | null) => {
    if (activeStrategyName) {
      setBacktestResultForStrategy(activeStrategyName, result);
    }
  }, [activeStrategyName, setBacktestResultForStrategy]);

  const currentBacktestResult = (activeStrategyName && strategyResults[activeStrategyName])
    ? strategyResults[activeStrategyName]
    : null;

  return (
    <Context.Provider
      value={{
        data,
        setData: handleSetData,
        symbol,
        setSymbol,
        interval,
        setInterval,
        activeStrategyName,
        setActiveStrategyName,
        strategyResults,
        setBacktestResultForStrategy,
        clearStrategyResult,
        backtestResult: currentBacktestResult,
        setBacktestResult,
        isBacktestRunning,
        setIsBacktestRunning,
        selectedTradeTime,
        setSelectedTradeTime,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useOHLCV() {
  return useContext(Context);
}
