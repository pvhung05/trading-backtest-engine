# Strategy Module

Tài liệu này liệt kê các hàm chính, cách dùng và nhiệm vụ của module `strategy` trong hệ thống backtest.

## Nhiệm vụ của module

- Định nghĩa logic tạo chiến lược giao dịch từ tham số đầu vào.
- Tách biệt phần tính toán tín hiệu khỏi phần lấy dữ liệu market.
- Cung cấp warm-up bars cần thiết để market data có thể nạp thêm lịch sử trước khi backtest.
- Chuẩn hóa cách chọn strategy thông qua `StrategyType`.

## Luồng sử dụng

1. Chọn `StrategyType` và bộ `StrategyParameters` tương ứng.
2. Gọi `StrategyService.getRequiredWarmupBars(...)` để lấy số bar cần warm-up.
3. Gọi `MarketDataService.load(request, warmupBars)` để nạp thêm dữ liệu lịch sử.
4. Gọi `StrategyService.buildStrategy(...)` để tạo TA4J `Strategy`.
5. Chạy backtest bằng `BarSeries` đã được warm-up.

## Các class và hàm chính

### `StrategyService`

- `buildStrategy(StrategyType strategyType, BarSeries series, StrategyParameters parameters)`
  - Nhiệm vụ: lấy factory tương ứng từ registry và build ra `Strategy`.
  - Cách dùng: dùng khi đã có `BarSeries` và muốn tạo chiến lược để backtest.

- `getRequiredWarmupBars(StrategyType strategyType, StrategyParameters parameters)`
  - Nhiệm vụ: trả về số bar cần thêm để warm-up cho strategy được chọn.
  - Cách dùng: gọi trước khi load market data để market service nạp thêm lịch sử.

### `StrategyFactoryRegistry`

- `getFactory(StrategyType type)`
  - Nhiệm vụ: tìm `TradingStrategyFactory` theo loại strategy.
  - Cách dùng: được `StrategyService` dùng nội bộ, ít khi gọi trực tiếp.

### `TradingStrategyFactory`

- `getType()`
  - Nhiệm vụ: khai báo factory phục vụ `StrategyType` nào.

- `getRequiredWarmupBars(StrategyParameters parameters)`
  - Nhiệm vụ: trả về số bar warm-up cần thiết theo bộ tham số của strategy.
  - Cách dùng: market layer dùng kết quả này để nạp thêm history.

- `build(BarSeries series, StrategyParameters parameters)`
  - Nhiệm vụ: build TA4J `Strategy` từ dữ liệu và tham số.
  - Cách dùng: gọi sau khi series đã được warm-up.

### `MacdStrategyFactory`

- `getType()`
  - Trả về `StrategyType.MACD`.

- `getRequiredWarmupBars(MacdParameters parameters)`
  - Trả về `longPeriod + signalPeriod - 1`.

- `build(BarSeries series, StrategyParameters parameters)`
  - Tạo MACD indicator, signal line, entry rule và exit rule.

### `RsiStrategyFactory`

- `getType()`
  - Trả về `StrategyType.RSI`.

- `getRequiredWarmupBars(RsiParameters parameters)`
  - Trả về `period`.

- `build(BarSeries series, StrategyParameters parameters)`
  - Tạo RSI indicator và rule vào/ra lệnh theo ngưỡng oversold/overbought.

### `SmaCrossStrategyFactory`

- `getType()`
  - Trả về `StrategyType.SMA_CROSS`.

- `getRequiredWarmupBars(SmaCrossParameters parameters)`
  - Trả về `longPeriod`.

- `build(BarSeries series, StrategyParameters parameters)`
  - Tạo SMA ngắn, SMA dài và rule crossover.

### `MacdIndicatorProvider`

- `build(BarSeries series, Integer shortPeriod, Integer longPeriod)`
  - Nhiệm vụ: tạo `MACDIndicator` từ close price.

- `buildSignal(MACDIndicator macd, Integer signalPeriod)`
  - Nhiệm vụ: tạo đường signal là EMA của MACD.

### `RsiIndicatorProvider`

- `build(BarSeries series, Integer period)`
  - Nhiệm vụ: tạo `RSIIndicator` từ close price.

### `SmaIndicatorProvider`

- `build(BarSeries series, Integer period)`
  - Nhiệm vụ: tạo `SMAIndicator` từ close price.

### `MacdRuleProvider`

- `buildEntryRule(MACDIndicator macd, EMAIndicator signal)`
  - Nhiệm vụ: vào lệnh khi MACD cắt lên signal.

- `buildExitRule(MACDIndicator macd, EMAIndicator signal)`
  - Nhiệm vụ: thoát lệnh khi MACD cắt xuống signal.

### `RsiRuleProvider`

- `buildEntryRule(RSIIndicator rsi, Double oversold)`
  - Nhiệm vụ: vào lệnh khi RSI thấp hơn ngưỡng oversold.

- `buildExitRule(RSIIndicator rsi, Double overbought)`
  - Nhiệm vụ: thoát lệnh khi RSI cao hơn ngưỡng overbought.

### `SmaRuleProvider`

- `buildEntryRule(SMAIndicator shortSma, SMAIndicator longSma)`
  - Nhiệm vụ: vào lệnh khi SMA ngắn cắt lên SMA dài.

- `buildExitRule(SMAIndicator shortSma, SMAIndicator longSma)`
  - Nhiệm vụ: thoát lệnh khi SMA ngắn cắt xuống SMA dài.

## Các model tham số

### `MacdParameters`

- `shortPeriod`
- `longPeriod`
- `signalPeriod`

### `RsiParameters`

- `period`
- `overbought`
- `oversold`

### `SmaCrossParameters`

- `shortPeriod`
- `longPeriod`

### `StrategyParameters`

- Interface marker dùng để gom các kiểu tham số chiến lược.

## Ví dụ sử dụng

```java
StrategyType type = StrategyType.MACD;
StrategyParameters parameters = new MacdParameters(12, 26, 9);

int warmupBars = strategyService.getRequiredWarmupBars(type, parameters);
BarSeries series = marketDataService.load(request, warmupBars);

Strategy strategy = strategyService.buildStrategy(type, series, parameters);
```

## Lưu ý thiết kế

- Warm-up nên được lấy từ factory, không nên hard-code trong strategy runner.
- `MarketDataService` là nơi thích hợp để nạp thêm history theo warm-up bars.
- Factory chỉ nên mô tả nhu cầu của strategy, không nên làm nhiệm vụ fetch dữ liệu.