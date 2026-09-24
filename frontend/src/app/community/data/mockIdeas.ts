import type { TradingIdea, Author } from '../types';

export const mockAuthors: Record<string, Author> = {
  alex: {
    id: 'a1',
    name: 'Alexandre MarketWizard',
    username: 'alex_trader',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&auto=format',
    badge: 'TOP AUTHOR',
    reputation: 15420,
    followersCount: 8940,
  },
  tuan: {
    id: 'a2',
    name: 'Alex Tuan Quant',
    username: 'tuan_quant',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&auto=format',
    badge: 'QUANT DEV',
    reputation: 9240,
    followersCount: 4120,
  },
  sarah: {
    id: 'a3',
    name: 'Sarah Chen CFA',
    username: 'sarah_macro',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&auto=format',
    badge: 'PRO+',
    reputation: 24100,
    followersCount: 16500,
  },
  david: {
    id: 'a4',
    name: 'David K. CryptoFlow',
    username: 'david_orderflow',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&auto=format',
    badge: 'PRO',
    reputation: 7890,
    followersCount: 3200,
  },
};

export const initialTradingIdeas: TradingIdea[] = [
  {
    id: 'idea-1',
    title: 'When Markets Hit Records, Should You Still Be Buying? Macro & Trend Review',
    symbol: 'NASDAQ:IXIC',
    assetClass: 'indices',
    timeframe: '1D',
    direction: 'long',
    coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&auto=format',
    summary: 'The Nasdaq NASDAQ:IXIC is back at record highs. The S&P 500 SPX and Dow TVC:DJI have recently been there too. AI momentum and liquidity cycles suggest further expansion before any major mean reversion.',
    content: `## Nasdaq & S&P 500 Trend Analysis

The Nasdaq 100 and S&P 500 continue to reach new all-time highs driven by institutional inflows into tech and semiconductors.

### Key Technical Pillars:
1. **Trend Structure**: The 50-day SMA is sloping upward, acting as dynamic support for the Higher Highs & Higher Lows structure.
2. **RSI Indicator**: Oscillating in the 64-68 region without extreme overbought (>80), indicating buyers remain in control.
3. **Volume Profile**: Value Area High (VAH) successfully retested with immediate bounce.

> **Recommendation**: Maintain long positions, trailing stop loss along the recent swing low at 19,800.`,
    author: mockAuthors.sarah,
    likes: 342,
    boosts: 89,
    views: 4520,
    tags: ['Nasdaq', 'Macro', 'TrendFollowing', 'AI-Rally'],
    isEditorsPick: true,
    createdAt: '2026-09-24T06:30:00Z',
    entryPrice: '20,150.00',
    targetPrice: '21,500.00',
    stopLossPrice: '19,650.00',
    comments: [
      {
        id: 'c1',
        author: mockAuthors.tuan,
        content: 'Spot on analysis! My SMA 20/50 algorithmic models on Nasdaq are giving solid continuation signals.',
        createdAt: '2026-09-24T07:15:00Z',
        likes: 18,
      },
      {
        id: 'c2',
        author: mockAuthors.david,
        content: 'Keep an eye on the upcoming FOMC meeting for potential short-term liquidity sweeps.',
        createdAt: '2026-09-24T08:00:00Z',
        likes: 7,
      },
    ],
  },
  {
    id: 'idea-2',
    title: '$IGV / $NVDA: Potential Cup-with-Handle Pattern Formation & Breakout Target',
    symbol: 'NASDAQ:NVDA',
    assetClass: 'stocks',
    timeframe: '4h',
    direction: 'long',
    coverImage: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800&h=450&fit=crop&auto=format',
    summary: 'Overview IGV is the Expanded Tech-Software Sector ETF. Software has lagged while AI chips and hardware rallied, and other AI-related sectors are forming a multi-month Cup with Handle pattern.',
    content: `## Cup & Handle Technical Breakdown

NVDA and the IGV software sector ETF are finalizing the handle formation following a 3-month rounded cup base.

### Confirmation Signals:
- Volume dry-up during handle formation indicates declining sell pressure.
- Breakout triggers on a daily close above the $135.50 resistance accompanied by 1.8x average volume.`,
    author: mockAuthors.alex,
    likes: 215,
    boosts: 46,
    views: 3100,
    tags: ['NVDA', 'CupAndHandle', 'ChartPatterns', 'Breakout'],
    isEditorsPick: true,
    createdAt: '2026-09-23T20:10:00Z',
    entryPrice: '$132.80',
    targetPrice: '$155.00',
    stopLossPrice: '$124.50',
    comments: [
      {
        id: 'c3',
        author: mockAuthors.sarah,
        content: 'Great setup! Volume contraction at the handle low is classic VSA behavior.',
        createdAt: '2026-09-23T21:00:00Z',
        likes: 12,
      },
    ],
  },
  {
    id: 'idea-3',
    title: 'US100 / BTC Technical Breakdown: Critical Value Area Low Retest Ahead!',
    symbol: 'BINANCE:BTCUSDT',
    assetClass: 'crypto',
    timeframe: '1D',
    direction: 'short',
    videoDuration: '05:19',
    coverImage: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&h=450&fit=crop&auto=format',
    summary: 'BTC is building momentum around a critical inflection point after a rejection at the upper liquidity pool. Watch for a liquidity sweep before any recovery.',
    content: `## Order Flow & Liquidity Heatmap Analysis for BTCUSDT

Bitcoin is facing strong psychological resistance around $66,500. Order book heatmaps show heavy limit sell orders clustered in this zone.

### Short Setup Plan:
- **Entry Zone**: $65,800 - $66,400
- **Stop Loss**: $67,500 (above liquidity sweep wick)
- **Take Profit 1**: $62,000 (4h Fair Value Gap)
- **Take Profit 2**: $58,500 (Sell-side Liquidity pool)`,
    author: mockAuthors.david,
    likes: 189,
    boosts: 62,
    views: 4890,
    tags: ['Bitcoin', 'Crypto', 'OrderFlow', 'ShortSetup', 'VideoAnalysis'],
    isEditorsPick: false,
    createdAt: '2026-09-23T16:45:00Z',
    entryPrice: '$66,100',
    targetPrice: '$58,500',
    stopLossPrice: '$67,500',
    comments: [],
  },
  {
    id: 'idea-4',
    title: 'ETH/USDT: Bullish Divergence on Daily RSI with Symmetrical Triangle Squeeze',
    symbol: 'BINANCE:ETHUSDT',
    assetClass: 'crypto',
    timeframe: '1D',
    direction: 'long',
    coverImage: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=800&h=450&fit=crop&auto=format',
    summary: 'Ethereum has formed a double bottom pattern on daily charts accompanied by a strong RSI bullish divergence. Target projection points to $3,200.',
    content: `## Daily RSI Bullish Divergence for Ethereum

Ethereum (ETHUSDT) is printing a bullish engulfing pattern right at the $2,400 support level.

- Clear bullish divergence on daily RSI (Price Higher Low vs RSI Higher Low).
- MACD histogram turning light green, signaling impending Golden Cross.`,
    author: mockAuthors.tuan,
    likes: 156,
    boosts: 38,
    views: 2890,
    tags: ['Ethereum', 'RSI-Divergence', 'Altseason', 'TradingBot'],
    isEditorsPick: true,
    createdAt: '2026-09-23T11:20:00Z',
    entryPrice: '$2,480.00',
    targetPrice: '$3,200.00',
    stopLossPrice: '$2,320.00',
    comments: [],
  },
  {
    id: 'idea-5',
    title: 'EUR/USD: Channel Break & Retest Setup ahead of Central Bank Interest Rate Decision',
    symbol: 'FX:EURUSD',
    assetClass: 'forex',
    timeframe: '4h',
    direction: 'neutral',
    coverImage: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop&auto=format',
    summary: 'EURUSD is consolidating inside an ascending broadening wedge. A wait-and-see approach is recommended until clean breakout confirmation occurs.',
    content: `## EUR/USD Analysis Ahead of ECB Rate Decision

EUR/USD is consolidating in a narrow range of 1.1080 - 1.1160. Traders are advised to wait for a clean breakout on 4h candle closes before establishing directional positions.`,
    author: mockAuthors.sarah,
    likes: 98,
    boosts: 21,
    views: 1940,
    tags: ['Forex', 'EURUSD', 'CentralBanks', 'PriceAction'],
    isEditorsPick: false,
    createdAt: '2026-09-22T19:00:00Z',
    comments: [],
  },
  {
    id: 'idea-6',
    title: 'Backtest Result: EMA 9/21 Dynamic Cross Strategy on SOLUSDT with 68% Win Rate',
    symbol: 'BINANCE:SOLUSDT',
    assetClass: 'crypto',
    timeframe: '1h',
    direction: 'long',
    coverImage: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=450&fit=crop&auto=format',
    summary: 'Automated quantitative backtest across 1,200 trades reveals a solid Profit Factor of 2.14 with max drawdown strictly capped below 11.2%.',
    content: `## EMA 9/21 Algorithmic Backtest Report on SOLUSDT

We simulated backtesting on 1h SOLUSDT historical candles:

### Performance Metrics:
- **Total Trades**: 1,248
- **Win Rate**: 68.4%
- **Profit Factor**: 2.14
- **Max Drawdown**: 10.8%
- **Sharpe Ratio**: 1.82

This strategy integrates an ADX > 25 filter to avoid false breakout signals during sideways chop.`,
    author: mockAuthors.tuan,
    likes: 278,
    boosts: 94,
    views: 5200,
    tags: ['Solana', 'QuantTrading', 'Backtest', 'EMA-Cross', 'Algorithm'],
    isEditorsPick: true,
    createdAt: '2026-09-22T14:30:00Z',
    entryPrice: '$148.50',
    targetPrice: '$180.00',
    stopLossPrice: '$139.00',
    comments: [],
  },
];
