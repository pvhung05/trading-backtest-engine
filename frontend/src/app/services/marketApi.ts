import { apiFetch } from './apiClient';

export interface SymbolResponse {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  pricePrecision: number;
  quantityPrecision: number;
}

export interface MarketTickerResponse {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  updateTime: number;
}

export interface KlineResponse {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume?: string;
  trades?: number;
  isClosed?: boolean;
}

export interface GetKlinesParams {
  symbol: string;
  interval: string;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export const marketApi = {
  async getAllSymbols(): Promise<SymbolResponse[]> {
    return apiFetch<SymbolResponse[]>('/api/market/symbols');
  },

  async searchSymbols(query: string): Promise<SymbolResponse[]> {
    const encoded = encodeURIComponent(query);
    return apiFetch<SymbolResponse[]>(`/api/market/symbols/search?q=${encoded}`);
  },

  async getWatchlist(limit = 30): Promise<MarketTickerResponse[]> {
    return apiFetch<MarketTickerResponse[]>(`/api/market/watchlist?limit=${limit}`);
  },

  async filterWatchlist(quoteAsset: string): Promise<MarketTickerResponse[]> {
    const encoded = encodeURIComponent(quoteAsset);
    return apiFetch<MarketTickerResponse[]>(`/api/market/watchlist/filter?quoteAsset=${encoded}`);
  },

  async getTicker(symbol: string): Promise<MarketTickerResponse> {
    const encoded = encodeURIComponent(symbol.toUpperCase());
    return apiFetch<MarketTickerResponse>(`/api/market/watchlist/${encoded}`);
  },

  async getKlines(params: GetKlinesParams): Promise<KlineResponse[]> {
    const { symbol, interval, limit = 500, startTime, endTime } = params;
    const query = new URLSearchParams({
      symbol: symbol.toUpperCase(),
      interval,
      limit: String(limit),
    });
    if (startTime) query.append('startTime', String(startTime));
    if (endTime) query.append('endTime', String(endTime));

    return apiFetch<KlineResponse[]>(`/api/market/klines?${query.toString()}`);
  },

  async getSymbolDetails(symbol: string): Promise<SymbolResponse> {
    const encoded = encodeURIComponent(symbol.toUpperCase());
    return apiFetch<SymbolResponse>(`/api/market/symbol/${encoded}`);
  },
};
