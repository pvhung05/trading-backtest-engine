export interface SelectedIndicator {
  id: string;
  name: string;
  type?: string;
  badge?: 'NEW' | 'BETA';
  period?: number;
  color?: string;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
  multiplier?: number;
  oversold?: number;
  overbought?: number;
}

export interface SelectedStrategy {
  name: string;
  badge?: 'NEW' | 'BETA';
}
