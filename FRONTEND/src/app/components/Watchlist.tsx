import { ChevronDown } from 'lucide-react';
import { BTC_USD_DAILY } from '../data/mockOHLCV';

interface WatchlistItem {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  icon?: string;
}

const stocksData: WatchlistItem[] = [];

const cryptoData: WatchlistItem[] = (() => {
  const candles = BTC_USD_DAILY;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const first = candles[0];
  return [
    {
      symbol: 'BTC/USD',
      name: 'Bitcoin',
      price: last.close,
      change: last.close - prev.close,
      changePercent: ((last.close - prev.close) / prev.close) * 100,
      icon: '₿',
    },
    {
      symbol: 'BTC/USD',
      name: 'Bitcoin (period)',
      price: last.close,
      change: last.close - first.open,
      changePercent: ((last.close - first.open) / first.open) * 100,
      icon: '₿',
    },
  ];
})();

const futuresData: WatchlistItem[] = [
  { symbol: 'USOIL', price: 86.46, change: 2.47, changePercent: 2.94 },
  { symbol: 'GOLD', price: 4817.542, change: -19.948, changePercent: -0.41 },
  { symbol: 'SILVER', price: 79.9214, change: -0.8576, changePercent: -1.06 },
];

const forexData: WatchlistItem[] = [
  { symbol: 'EURUSD', price: 1.17727, change: 0.00098, changePercent: 0.08 },
  { symbol: 'GBPUSD', price: 1.35255, change: 0.00149, changePercent: 0.11 },
  { symbol: 'USDJPY', price: 158.749, change: 0.162, changePercent: 0.10 },
];

export function Watchlist() {
  return (
    <div className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 h-full overflow-y-auto text-gray-900 dark:text-gray-100">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="font-semibold text-sm">Watchlist</span>
        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-gray-200/80 dark:border-gray-700/80">
        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-400 dark:text-gray-500">
          <div>Symbol</div>
          <div className="text-right">Last</div>
          <div className="text-right">Chg</div>
          <div className="text-right">Chg%</div>
        </div>
      </div>

      {stocksData.length > 0 && (
        <div className="border-b border-gray-100 dark:border-gray-700/80 py-1">
          <div className="px-3 py-1.5 flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <ChevronDown className="w-3 h-3" />
            <span>STOCKS</span>
          </div>
        </div>
      )}

      <div className="border-b border-gray-100 dark:border-gray-700/80 py-1">
        <div className="px-3 py-1.5 flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <ChevronDown className="w-3 h-3" />
          <span>CRYPTO</span>
        </div>
        {cryptoData.map((item, idx) => (
          <WatchlistRow
            key={`${item.symbol}-${idx}`}
            item={item}
            isSelected={idx === 0}
          />
        ))}
      </div>

      <div className="border-b border-gray-100 dark:border-gray-700/80 py-1">
        <div className="px-3 py-1.5 flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <ChevronDown className="w-3 h-3" />
          <span>FUTURES</span>
        </div>
        {futuresData.map((item) => (
          <WatchlistRow key={item.symbol} item={item} />
        ))}
      </div>

      <div className="border-b border-gray-100 dark:border-gray-700/80 py-1">
        <div className="px-3 py-1.5 flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <ChevronDown className="w-3 h-3" />
          <span>FOREX</span>
        </div>
        {forexData.map((item) => (
          <WatchlistRow key={item.symbol} item={item} />
        ))}
      </div>
    </div>
  );
}

function WatchlistRow({ item, isSelected = false }: { item: WatchlistItem; isSelected?: boolean }) {
  const isPositive = item.change >= 0;

  return (
    <div
      className={`mx-1.5 my-0.5 px-2.5 py-1.5 grid grid-cols-4 gap-2 text-xs rounded-lg transition-all duration-150 cursor-pointer ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium shadow-2xs'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-800 dark:text-gray-200'
      }`}
    >
      <div className="font-semibold truncate">{item.symbol}</div>
      <div className="text-right tabular-nums">
        {item.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
      </div>
      <div className={`text-right tabular-nums font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? '+' : ''}{item.change.toLocaleString('en-US', { maximumFractionDigits: 2 })}
      </div>
      <div className={`text-right tabular-nums font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
      </div>
    </div>
  );
}
