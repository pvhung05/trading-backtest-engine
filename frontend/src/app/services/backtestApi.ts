import { apiFetch } from './apiClient';

export interface RunBacktestPayload {
  symbol: string;
  timeframe: string;
  startTime: string; // ISO-8601 string, e.g. "2024-01-01T00:00:00Z"
  endTime?: string;
  strategyType: 'SMA_CROSS' | 'RSI' | 'MACD' | string;
  strategyParams: {
    params: Record<string, any>;
  };
  initialCapital: number;
  commissionRate?: number;
  slippageRate?: number;
  positionSizePercent?: number;
}

export interface MetricsDetail {
  initialCapital: number;
  finalBalance: number;
  totalReturnPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  expectancy: number;
  rewardRiskRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  cagr: number;
}

export interface TradeDetail {
  tradeNumberWithSide: string; // e.g. "1 Long"
  type: 'Entry' | 'Exit' | string;
  dateTime: string;
  signal: string;
  price: number;
  sizeBtc: number;
  sizeUsd: number;
  netPnl: number | null;
  favorableExcursion: number | null;
  adverseExcursion: number | null;
  cumulativePnl: number | null;
}

export interface EquityPointDetail {
  timestamp: string;
  equity: number;
  cash: number;
  openPositionPnl: number;
  tradeNumber: number;
}

export interface BacktestRunDetailResponse {
  id: number;
  strategyType: string;
  strategyParams: string;
  symbol: string;
  timeframe: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  executionDurationMs: number;
  metrics: MetricsDetail;
  trades: TradeDetail[];
  equityCurve: EquityPointDetail[];
}

export interface BacktestRunSummaryResponse {
  id: number;
  strategyType: string;
  symbol: string;
  timeframe: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  executionDurationMs: number;
  totalReturnPercent?: number;
  winRate?: number;
  totalTrades?: number;
}

export const backtestApi = {
  async runBacktest(payload: RunBacktestPayload): Promise<BacktestRunDetailResponse> {
    return apiFetch<BacktestRunDetailResponse>('/api/backtest-runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listRuns(page = 0, size = 10): Promise<BacktestRunSummaryResponse[]> {
    return apiFetch<BacktestRunSummaryResponse[]>(`/api/backtest-runs?page=${page}&size=${size}`);
  },

  async getRun(id: number): Promise<BacktestRunDetailResponse> {
    return apiFetch<BacktestRunDetailResponse>(`/api/backtest-runs/${id}`);
  },

  async getTrades(id: number): Promise<TradeDetail[]> {
    return apiFetch<TradeDetail[]>(`/api/backtest-runs/${id}/trades`);
  },

  async getMetrics(id: number): Promise<MetricsDetail> {
    return apiFetch<MetricsDetail>(`/api/backtest-runs/${id}/metrics`);
  },

  async getEquity(id: number): Promise<EquityPointDetail[]> {
    return apiFetch<EquityPointDetail[]>(`/api/backtest-runs/${id}/equity`);
  },

  async deleteRun(id: number): Promise<void> {
    return apiFetch<void>(`/api/backtest-runs/${id}`, {
      method: 'DELETE',
    });
  },
};
