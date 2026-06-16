# Trading Backtest Engine - Architecture Overview

## Project Structure

```
com.trading.apps
│
├── api                                    # REST Controllers, DTOs, Mappers
│   ├── controller/
│   │   ├── auth/AuthController
│   │   ├── backtest/BacktestController
│   │   ├── execution/ExecutionController
│   │   ├── market/MarketDataController
│   │   ├── metrics/MetricsController
│   │   └── portfolio/PortfolioController
│   ├── request/                          # DTOs nhận từ client
│   ├── response/                          # DTOs trả về cho client
│   ├── mapper/                            # Domain → Response DTO
│   └── exception/                         # Exception handlers
│
├── auth                                   # JWT Authentication
│   ├── config/SecurityConfig.java
│   ├── entity/AppUser.java
│   ├── security/JwtService.java, JwtAuthenticationFilter.java
│   ├── repository/UserRepository.java
│   └── service/AuthService.java
│
├── market                                 # Market Data (Binance API)
│   ├── cache/MarketDataCache.java         # In-memory cache
│   ├── loader/BinanceApiLoader.java       # REST API caller
│   ├── provider/BinanceMarketDataProvider.java
│   ├── slicer/SeriesSlicer.java
│   ├── service/MarketDataService.java
│   └── model/Candle.java, MarketDataRequest.java
│
├── strategy                               # Strategy Factories
│   ├── factory/TradingStrategyFactory.java, StrategyFactoryRegistry.java
│   ├── indicator/ (SMA, MACD, RSI providers)
│   ├── rule/     (entry/exit rules)
│   └── model/StrategyParameters.java, SmaCrossParameters.java, etc.
│
├── backtest                               # TA4J Simulation Engine
│   ├── service/BacktestEngine.java, BacktestService.java
│   └── model/BacktestResult.java, Trade.java
│
├── execution                              # Real-world Execution Simulation
│   ├── calculator/CommissionCalculator, SlippageCalculator, QuantityCalculator
│   ├── service/DefaultExecutionService, ExecutionService.java
│   └── model/ExecutedTrade.java, ExecutionConfig.java
│
├── portfolio                              # Equity Curve Calculation
│   ├── service/DefaultPortfolioService.java
│   └── model/PortfolioResult.java, EquityPoint.java
│
└── metrics                                # 20 Performance Calculators
    ├── calculator/ (WinRate, Sharpe, Sortino, CAGR, MaxDrawdown, etc.)
    ├── service/MetricsService.java, DefaultMetricsService.java
    └── model/MetricsResult.java
```

---

## System Overview

```
                          ┌──────────────────────────────────┐
                          │           CLIENT (Frontend)       │
                          │  POST /api/... → JSON Response   │
                          └─────────────────┬────────────────┘
                                            │ HTTP
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               API LAYER                                      │
│                                                                              │
│  AuthController        ◄────────────────────────────────── Login/Register    │
│  BacktestController    ◄────────────────────────────────── Backtest Run      │
│  ExecutionController   ◄────────────────────────────────── Execute & Sim    │
│  PortfolioController   ◄────────────────────────────────── Portfolio Sim    │
│  MetricsController     ◄────────────────────────────────── Calculate Metrics │
│  MarketDataController  ◄────────────────────────────────── Load Market Data  │
│                                                                              │
│  Exception Handlers (per module) → unified ErrorResponse                     │
└─────┬───────┬───────┬───────┬───────┬───────┬────────────────────────────────┘
      │       │       │       │       │       │
      ▼       ▼       ▼       ▼       ▼       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      MARKET LAYER (Data Source - NGUỒN DỮ LIỆU ĐẦU VÀO)       │
│                                                                              │
│   MarketDataService                                                          │
│        │                                                                     │
│        ├── MarketDataCache (in-memory, "SYMBOL-TIMEFRAME" keys)             │
│        │      │                                                              │
│        │      ├── HIT  ──► return cached BarSeries                          │
│        │      └── MISS ──► BinanceMarketDataProvider                         │
│        │                    └── BinanceApiLoader ──► Binance REST API         │
│        │                        https://api.binance.com/api/v3/klines         │
│        │                                                                     │
│        └── BarSeries (ta4j) ──► BacktestEngine                              │
│                                   (dữ liệu OHLCV được truyền xuống đây)      │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ BarSeries (OHLCV data)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     BACKTEST LAYER (Strategy Signals)                        │
│                                                                              │
│   BacktestService                                                            │
│       │                                                                     │
│       ├── StrategyService ──► Strategy (SMA/MACD/RSI)                      │
│       │                                                                     │
│       └── Ta4jBacktestEngine.run(series, strategy)                          │
│               │                                                             │
│               ▼                                                             │
│          TradingRecord                                                      │
│          (entry/exit signals - CHƯA có phí, CHƯA có slippage)               │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ TradingRecord (signals)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      EXECUTION LAYER (Real-world Simulation)                  │
│                                                                              │
│   ExecutionSimulationService                                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ DefaultExecutionService                                              │   │
│   │                                                                      │   │
│   │  For each signal in TradingRecord:                                   │   │
│   │                                                                      │   │
│   │  1. QuantityCalculator     ──► position size từ % capital              │   │
│   │  2. SlippageCalculator   ──► entry/exit price + slippage              │   │
│   │  3. CommissionCalculator ──► commission per trade                     │   │
│   │                                                                      │   │
│   │  Output: ExecutedTrade {                                             │   │
│   │      netProfit = grossProfit - commission - slippageCost              │   │
│   │  }                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ ExecutedTrade[]
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      PORTFOLIO LAYER (Mark-to-Market)                        │
│                                                                              │
│   PortfolioService.calculate(executedTrades, initialCapital)                  │
│       │                                                                     │
│       ├─► equityCurve: mark-to-market after each trade                      │
│       │      Ví dụ: initial=10000, trade1=+200, trade2=-50, ...            │
│       │              → equityPoints = [10200, 10150, ...]                   │
│       │                                                                     │
│       └─► PortfolioResult {                                                 │
│               equityCurve, snapshots, totalReturn, maxDrawdown             │
│           }                                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ ExecutedTrade[] + PortfolioResult
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      METRICS LAYER (Performance Statistics)                   │
│                                                                              │
│   MetricsService.calculate(executedTrades, portfolioResult)                  │
│       │                                                                     │
│       ├─ Trade-based: WinRate, ProfitFactor, Expectancy, Best/Worst, ...   │
│       │                                                                     │
│       └─ Return-based: TotalReturn, CAGR, Sharpe, Sortino, MaxDrawdown... │
│               (dùng equityCurve từ PortfolioResult để tính Sharpe/Sortino)  │
│                                                                              │
│       Output: MetricsResult (22 metrics)                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Communication Matrix

| Module gửi | Giao tiếp | Module nhận | Cơ chế | Mục đích |
|-----------|-----------|-------------|--------|----------|
| Client | HTTP | API Controllers | REST/JSON | Gửi request, nhận response |
| API Controllers | Service call | ExecutionSimulationService | Java method | Lấy executed trades |
| API Controllers | Service call | MetricsService | Java method | Tính 22 metrics |
| API Controllers | Service call | PortfolioService | Java method | Tính equity curve |
| API Controllers | Service call | BacktestService | Java method | Lấy backtest results |
| ExecutionSimulationService | Service call | MarketDataService | Java method | Load BarSeries |
| ExecutionSimulationService | Service call | StrategyService | Java method | Build strategy |
| ExecutionSimulationService | Service call | BacktestEngine | Java method | Chạy backtest |
| ExecutionSimulationService | Service call | DefaultExecutionService | Java method | Apply slippage/commission |
| ExecutionSimulationService | Service call | PortfolioService | Java method | Tính equity curve |
| ExecutionSimulationService | Service call | MetricsService | Java method | Tính metrics (Option B) |
| MetricsService | Model object | execution.model | Pass ExecutedTrade[] | Đọc trade data |
| MetricsService | Model object | portfolio.model | Pass EquityCurve | Sharpe, Sortino, MaxDrawdown |
| BacktestService | Model object | MarketDataService | Pass MarketDataRequest | Lấy market data |
| BacktestService | Model object | StrategyService | Pass StrategyParameters | Lấy strategy |
| DefaultExecutionService | Model object | BacktestEngine | Pass TradingRecord | Đọc entry/exit signals |
| MarketDataService | External call | BinanceMarketDataProvider | HTTP REST | Fetch klines |
| AuthController | JWT | JwtAuthenticationFilter | Filter chain | Xác thực |

---

## 4 Luồng Giao Tiếp Chính

### Luồng 1: Market Data Loading

```
Client
  │
  │ GET /api/market/load?symbol=BTCUSDT&timeframe=1h&start=...
  ▼
MarketDataController.load()
  │
  ▼
MarketDataService.load(request)
  │
  ├─► MarketDataCache.get(key) ──► "BTCUSDT-1h"
  │      │
  │      ├── HIT  ──► return cached BarSeries
  │      │
  │      └── MISS ──► BinanceMarketDataProvider
  │                      │
  │                      ▼
  │                   BinanceApiLoader
  │                      │
  │                      ▼
  │                   Binance REST API (https://api.binance.com/api/v3/klines)
  │                      │
  │                      ▼
  │                   CandleMapper → Candle[]
  │                      │
  │                      ▼
  │                   BarSeries (ta4j)
  │                      │
  │                      ▼
  │                   MarketDataCache.put(key, series)
  │
  ▼
return MarketDataResponse (OHLCV bars)
```

### Luồng 2: Backtest (Không tính phí)

```
Client
  │
  │ POST /api/backtest/run
  ▼
BacktestController.run()
  │
  ▼
BacktestService.runBacktest(command)
  │
  ├─► MarketDataService.load(request) ──► BarSeries
  │      (MarketDataCache or Binance API)
  │
  ├─► StrategyService.buildStrategy(type, params) ──► Strategy
  │      (SMA, MACD, RSI strategy)
  │
  └─► Ta4jBacktestEngine.run(series, strategy) ──► TradingRecord
         (Entry/exit signals - không có phí, không slippage)

         TradingRecord chứa:
         - List<TradingEntry> (index, price)
         - List<TradingExit>  (index, price)
         - TotalResult (gross profit/loss)

  ▼
return BacktestTradingRecordResponse (signal list)
```

### Luồng 3: Execution Simulation (Có tính phí, slippage, sizing)

```
Client
  │
  │ POST /api/execution/executed-trades
  ▼
ExecutionController.execute()
  │
  ▼
ExecutionSimulationService.execute(command)
  │
  ├─► MarketDataService.load(request) ──► BarSeries
  │
  ├─► StrategyService.buildStrategy(type, params) ──► Strategy
  │
  ├─► BacktestEngine.run(series, strategy) ──► TradingRecord
  │      (entry/exit signals từ strategy)
  │
  ├─► DefaultExecutionService.execute(tradingRecord, series, config)
  │      │
  │      ├─► QuantityCalculator.calculate(capital, price, positionSizePercent)
  │      │      Ví dụ: capital=10000, price=50000, size=10%
  │      │      → quantity = 10000 * 10% / 50000 = 0.02 BTC
  │      │
  │      ├─► SlippageCalculator.apply(price, side, slippageRate)
  │      │      Long entry: executedPrice = price * (1 + slippageRate)
  │      │      Long exit:   executedPrice = price * (1 - slippageRate)
  │      │
  │      └─► CommissionCalculator.calculate(quantity, price, commissionRate)
  │             Ví dụ: 0.02 * 50000 * 0.001 = 1 USDT
  │
  ▼
return List<ExecutedTrade>
    ExecutedTrade {
        symbol, side, quantity,
        entryPrice, exitPrice,
        netProfit (đã trừ commission + slippage)
        commission, slippageCost,
        entryTime, exitTime,
        pnlPercent
    }
```

### Luồng 4: Portfolio + Metrics (Mark-to-market & 22 chỉ số)

```
ExecutedTrade[]
  │
  ├─────────────────────────────────────────────────────────────────┐
  │                                                                  │
  ▼                                                                  ▼
PortfolioService.calculate()                              MetricsService.calculate()
  │                                                                  │
  ├─ Mark-to-market equity curve:                                ├─ Trade-based metrics:
  │                                                                  │   TotalTradesCalculator
  │  initialCapital = 10000                                        │   WinRateCalculator
  │                                                                  │   WinningTradesCalculator
  │  For each trade:                                              │   LosingTradesCalculator
  │    equity += trade.netProfit                                  │   BestTradeCalculator
  │    equityPoints.add(timestamp, equity)                         │   WorstTradeCalculator
  │                                                                  │   AverageWinCalculator
  │  PortfolioResult {                                            │   AverageLossCalculator
  │      equityCurve: List<EquityPoint>                           │   ProfitFactorCalculator
  │      snapshots: List<PortfolioSnapshot>                       │   ExpectancyCalculator
  │      totalReturn, maxDrawdown, ...                            │   ConsecutiveWinsCalculator
  │  }                                                            │   ConsecutiveLossesCalculator
  │                                                                  │   RewardRiskRatioCalculator
  │                                                                  │
  │  EquityCurve dùng cho:                                        ├─ Return-based metrics:
  │  - Sharpe Ratio (daily returns)                               │   TotalReturnCalculator
  │  - Sortino Ratio (downside deviation)                         │   CAGRCalculator
  │  - Max Drawdown (peak-to-trough)                              │
  │  - Recovery Factor                                            ├─ Risk metrics:
  │                                                                  │   SharpeRatioCalculator
  │                                                                  │   SortinoRatioCalculator
  │                                                                  │   MaxDrawdownCalculator
  │                                                                  │   CalmarRatioCalculator
  │                                                                  │   RecoveryFactorCalculator
  │                                                                  │
  └────────────────────────────────────────────────► Return PortfolioResult ┘
                                                          │
                                                          ▼
                                                     MetricsResult
                                                     (22 metrics)
```

---

## Integration Option B: Controller Orchestration

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PortfolioController                                │
│                                                                          │
│  @PostMapping("/simulate")                                              │
│  public ResponseEntity<SimulationFullResponse> simulate(                 │
│          @RequestBody PortfolioSimulationRequest request) {               │
│                                                                          │
│      // 1. Chạy execution simulation                                    │
│      PortfolioSimulationResponse portfolio =                             │
│          executionSimulationService.simulate(request);                   │
│                                                                          │
│      // 2. Tính metrics (dùng lại trades + equity từ step 1)            │
│      MetricsResult metrics = metricsService.calculate(                   │
│              portfolio.getTrades(),                                     │
│              portfolio.getPortfolioResult());                            │
│                                                                          │
│      // 3. Map thành response đầy đủ                                     │
│      return ResponseEntity.ok(                                          │
│              responseMapper.toFullResponse(portfolio, metrics));         │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘

Response mẫu:
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "strategyType": "SMA_CROSS",
  "capital": 10000,
  "tradeCount": 47,
  "trades": [...],
  "portfolioResult": {
    "equityCurve": [...],
    "totalReturn": 15.2,
    "maxDrawdown": -8.5
  },
  "metrics": {
    "winRate": 0.553,
    "profitFactor": 1.85,
    "sharpeRatio": 1.42,
    "sortinoRatio": 1.98,
    "totalReturn": 15.2,
    "cagr": 18.3,
    "maxDrawdown": -8.5,
    ...
  }
}
```

---

## Integration Option A: Execution Service Tính Metrics Luôn

```
ExecutionSimulationService.execute(...)
  │
  ├─► MarketDataService.load()
  ├─► StrategyService.build()
  ├─► BacktestEngine.run()
  ├─► DefaultExecutionService.execute() ──► ExecutedTrade[]
  │
  ├─► PortfolioService.calculate() ──► PortfolioResult
  │
  ├─► MetricsService.calculate(trades, portfolioResult) ──► MetricsResult  ◄── THÊM
  │
  ▼
Response có đủ: trades + equityCurve + metrics
```

**Khác biệt:**
- **Option A**: ExecutionService gọi MetricsService (1 service gọi service khác)
- **Option B**: Controller gọi cả 2 service (orchestration ở controller)

---

## Response Structure Theo Từng Endpoint

| Endpoint | Trả về | Module sinh ra |
|---------|--------|---------------|
| `POST /api/auth/register` | `AuthResponse` (JWT) | AuthService |
| `POST /api/auth/login` | `AuthResponse` (JWT) | AuthService |
| `POST /api/market/load` | `MarketDataResponse` (OHLCV) | MarketDataService |
| `POST /api/backtest/run` | `BacktestTradingRecordResponse` (signals) | BacktestService |
| `POST /api/execution/executed-trades` | `ExecutionSimulationResponse` (trades) | ExecutionSimulationService |
| `POST /api/portfolio/simulate` | `PortfolioSimulationResponse` (trades + equity) | ExecutionSimulationService + PortfolioService |
| `POST /api/metrics/calculate` | `MetricsSimulationResponse` (22 metrics) | MetricsService |
| `POST /api/simulation/full` *(mới)* | `{trades + equity + metrics}` | ExecutionSimulationService + MetricsService |

---

## External Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│  External Services                                          │
│                                                             │
│  Binance REST API ──► MarketDataService                     │
│  https://api.binance.com/api/v3/klines                      │
│                                                             │
│  ta4j Framework ──► BacktestEngine, Strategy, Indicators    │
│  - BarSeries, Bar                                          │
│  - Strategy, TradingRecord, Position                       │
│  - Indicators: SMA, MACD, RSI, EMA, BollingerBands         │
│  - Rules: CompareRule, AndRule, OrRule, OverBuyRule...     │
│                                                             │
│  Spring Security ──► Auth, JWT                             │
│  Spring Data JPA ──► User persistence                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3 Cơ Chế Giao Tiếp Trong Hệ Thống

| Cơ chế | Ví dụ | Đặc điểm |
|--------|-------|----------|
| **HTTP Request/Response** | Client → Controller | Synchronous, stateless, RESTful |
| **Service Method Call** | Controller → Service | In-process, fast, type-safe |
| **Domain Object Passing** | Service → Service | Pass actual objects (ExecutedTrade, PortfolioResult) |
| **External HTTP** | BinanceApiLoader → Binance API | Async capable, needs error handling |

---

## Dependency Rule (No Circular Dependencies) - ĐÚNG THỨ TỰ

```
Client
  │
  ▼
API Layer
  │
  ▼
┌─────────────────────────────────────────────────────────────────┐
│  MARKET LAYER (lấy dữ liệu OHLCV từ Binance)                  │
│  → Không phụ thuộc module nào khác                              │
│  → Đứng ĐẦU TIÊN trong pipeline                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ BarSeries
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKTEST LAYER (chạy strategy, sinh entry/exit signals)        │
│  → Phụ thuộc: Market (lấy BarSeries)                           │
│  → Phụ thuộc: Strategy (lấy trading rules)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ TradingRecord (signals)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  EXECUTION LAYER (thêm slippage, commission, position sizing)   │
│  → Phụ thuộc: Backtest (lấy signals)                           │
│  → Phụ thuộc: Market (lấy price để tính slippage)              │
└────────────────────────┬────────────────────────────────────────┘
                         │ ExecutedTrade[]
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PORTFOLIO LAYER (mark-to-market equity curve)                  │
│  → Phụ thuộc: Execution (lấy ExecutedTrade[])                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ ExecutedTrade[] + PortfolioResult
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  METRICS LAYER (tính 22 chỉ số hiệu suất)                      │
│  → Phụ thuộc: Execution (lấy ExecutedTrade[])                    │
│  → Phụ thuộc: Portfolio (lấy EquityCurve cho Sharpe/Sortino)  │
└────────────────────────┬────────────────────────────────────────┘
                         ▼
                      Auth
                         │
                         ▼
                   Database (MySQL)
```

**Nguyên tắc:** Market → Backtest → Execution → Portfolio → Metrics
