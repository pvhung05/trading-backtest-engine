export interface CandleRow {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface KlineResponse {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume?: string;
  numberOfTrades?: number;
  takerBuyBaseAssetVolume?: string;
  takerBuyQuoteAssetVolume?: string;
}

export interface Ticker24hResponse {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface SymbolResponse {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
}
