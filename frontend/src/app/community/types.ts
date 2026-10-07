export type TradeDirection = 'long' | 'short' | 'neutral';

export type MarketCategory = 'all' | 'crypto' | 'stocks' | 'forex' | 'indices' | 'strategies' | 'educational';

export type IdeaFilter = 'popular' | 'editors_picks' | 'trending' | 'recent';

export type FriendStatus = 'not_friend' | 'pending_sent' | 'pending_received' | 'friends';

export interface Author {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  badge?: string; // 'PRO' | 'TOP AUTHOR' | 'QUANT DEV' | 'TRADER'
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
  targetPrice?: number | string;
  stopLossPrice?: number | string;
  entryPrice?: number | string;
  backtestRunId?: number;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;
  isOnline?: boolean;
  badge?: string;
  bio?: string;
  reputation?: number;
  followersCount?: number;
  followingCount?: number;
}

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface Media {
  id: string;
  url: string;
  type: 'image' | 'video';
  alt?: string;
}

export interface PostReactions {
  counts: Record<ReactionType, number>;
  myReaction: ReactionType | null;
  total: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  media: Media[];
  privacy: 'public' | 'friends' | 'private';
  reactions: PostReactions;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  groupId?: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  reactions: {
    counts: Record<string, number>;
    myReaction: ReactionType | null;
    total: number;
  };
  replyCount: number;
  createdAt: string;
  parentId?: string;
}

export interface Group {
  id: string;
  name: string;
  coverUrl: string;
  privacy: 'public' | 'private';
  memberCount: number;
  isMember: boolean;
  isPendingApproval?: boolean;
  description?: string;
  role?: 'ADMIN' | 'MEMBER';
}

export interface Notification {
  id: string;
  type: 'reaction' | 'comment' | 'friend_request' | 'mention' | 'group';
  actor: User;
  message: string;
  createdAt: string;
  isRead: boolean;
  referenceId?: string;
}

export interface FriendRequest {
  id: string;
  from: User;
  to: User;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
