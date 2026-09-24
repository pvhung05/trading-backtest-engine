export type TradeDirection = 'long' | 'short' | 'neutral';

export type MarketCategory = 'all' | 'crypto' | 'stocks' | 'forex' | 'indices' | 'strategies' | 'educational';

export type IdeaFilter = 'popular' | 'editors_picks' | 'trending' | 'recent';

export interface Author {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  badge?: string; // 'PRO' | 'TOP AUTHOR' | 'QUANT DEV'
  reputation?: number;
  followersCount?: number;
}

export interface IdeaComment {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
  likes: number;
}

export interface TradingIdea {
  id: string;
  title: string;
  symbol: string;
  assetClass: 'crypto' | 'stocks' | 'forex' | 'indices';
  timeframe: string; // '15m' | '1h' | '4h' | '1D' | '1W'
  direction: TradeDirection;
  coverImage: string;
  videoDuration?: string;
  summary: string;
  content: string;
  author: Author;
  likes: number;
  comments: IdeaComment[];
  boosts: number;
  views: number;
  tags: string[];
  isEditorsPick?: boolean;
  createdAt: string;
  targetPrice?: string;
  stopLossPrice?: string;
  entryPrice?: string;
}
