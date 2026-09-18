import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { BacktestRunDetailResponse } from '../services/backtestApi';

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
  const [backtestResult, setBacktestResult] = useState<BacktestRunDetailResponse | null>(null);
  const [isBacktestRunning, setIsBacktestRunning] = useState<boolean>(false);
  const [selectedTradeTime, setSelectedTradeTime] = useState<number | null>(null);

  const handleSetData = useCallback((newData: OHLCVData) => {
    setData(newData);
  }, []);

  return (
    <Context.Provider
      value={{
        data,
        setData: handleSetData,
        symbol,
        setSymbol,
        interval,
        setInterval,
        backtestResult,
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
