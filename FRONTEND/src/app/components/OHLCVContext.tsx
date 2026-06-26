import { createContext, useContext, useState, useCallback } from 'react';

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

interface OHLCVContextType {
  data: OHLCVData;
  setData: (data: OHLCVData) => void;
  symbol: string;
  setSymbol: (s: string) => void;
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
  symbol: 'BTC/USD',
  setSymbol: () => {},
});

export function OHLCVProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OHLCVData>(DEFAULT_DATA);
  const [symbol, setSymbol] = useState('BTC/USD');

  const handleSetData = useCallback((newData: OHLCVData) => {
    setData(newData);
  }, []);

  return (
    <Context.Provider value={{ data, setData: handleSetData, symbol, setSymbol }}>
      {children}
    </Context.Provider>
  );
}

export function useOHLCV() {
  return useContext(Context);
}
