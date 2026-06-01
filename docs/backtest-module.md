# Backtest Module

Tài liệu này mô tả nhiệm vụ của từng folder và từng file trong module `backtest` của ứng dụng backtest trading.

## Mục tiêu của module

Module `backtest` chỉ làm 4 việc:

1. Nhận `BarSeries` và `Strategy`.
2. Chạy backtest để tạo `TradingRecord`.
3. Chuyển `TradingRecord` thành mô hình nghiệp vụ `BacktestResult`.
4. Điều phối luồng backtest ở mức service.

Module này không chịu trách nhiệm:

- Gọi Binance API.
- Load market data trực tiếp.
- Tính metric như Sharpe ratio, drawdown.
- Quản lý portfolio.
- Lưu kết quả xuống database.
- Tạo API request/response DTO.

## Cấu trúc thư mục

```text
backtest
├── service
├── model
├── mapper
└── exception
```

## Từng folder

### `backtest/service`

Chứa các lớp điều phối và thực thi backtest.

Nhiệm vụ chính:

- Chạy engine backtest.
- Kết nối market data, strategy và mapper.
- Giữ logic điều phối ở một nơi duy nhất.

### `backtest/model`

Chứa các domain model của kết quả backtest.

Nhiệm vụ chính:

- Biểu diễn một trade đã hoàn tất.
- Biểu diễn toàn bộ kết quả backtest.
- Biểu diễn command đầu vào dùng cho use-case backtest.

### `backtest/mapper`

Chứa lớp chuyển đổi dữ liệu từ TA4J sang model nghiệp vụ.

Nhiệm vụ chính:

- Chuyển `TradingRecord` sang `BacktestResult`.
- Tách logic mapping khỏi service để dễ test và dễ bảo trì.

### `backtest/exception`

Chứa các exception riêng của module backtest.

Nhiệm vụ chính:

- Chuẩn hóa lỗi nghiệp vụ của backtest.
- Giữ cho service và mapper không phải ném exception generic quá nhiều.

## Từng file

### `backtest/service/BacktestEngine.java`

Interface định nghĩa contract chạy backtest.

Nhiệm vụ:

- Nhận `BarSeries` và `Strategy`.
- Trả về `TradingRecord`.

Sử dụng khi:

- Muốn thay thế engine backtest khác ngoài TA4J.

### `backtest/service/Ta4jBacktestEngine.java`

Implement mặc định của `BacktestEngine` dựa trên TA4J.

Nhiệm vụ:

- Dùng `BarSeriesManager` của TA4J để chạy strategy.
- Trả về `TradingRecord`.

Sử dụng khi:

- Backtest engine hiện tại dùng TA4J làm execution core.

### `backtest/service/BacktestService.java`

Service điều phối toàn bộ luồng backtest.

Nhiệm vụ:

- Nhận `BacktestCommand`.
- Hỏi strategy factory số bar warm-up cần thiết.
- Gọi `MarketDataService` để load `BarSeries`.
- Tạo `Strategy` từ `StrategyFactoryRegistry`.
- Chạy `BacktestEngine`.
- Map `TradingRecord` sang `BacktestResult`.

Sử dụng khi:

- API layer hoặc application layer muốn chạy một backtest hoàn chỉnh.

### `backtest/model/BacktestCommand.java`

Domain command đầu vào của backtest.

Field:

- `MarketDataRequest marketDataRequest`
- `StrategyType strategyType`
- `StrategyParameters strategyParameters`

Nhiệm vụ:

- Gom tất cả input cần thiết cho một lần backtest.
- Tách use-case input khỏi API DTO.

Sử dụng khi:

- Gọi `BacktestService.execute(...)`.

### `backtest/model/Trade.java`

Domain model biểu diễn một giao dịch đã đóng.

Field:

- `Instant entryTime`
- `double entryPrice`
- `Instant exitTime`
- `double exitPrice`
- `double profitPercent`

Nhiệm vụ:

- Lưu thông tin vào lệnh, ra lệnh và lợi nhuận phần trăm.

Sử dụng khi:

- Trả kết quả từng trade trong backtest.

### `backtest/model/BacktestResult.java`

Domain model chứa kết quả cuối cùng của backtest.

Field:

- `List<Trade> trades`

Nhiệm vụ:

- Gom tất cả trade đã đóng thành một kết quả duy nhất.

Sử dụng khi:

- Trả kết quả từ `BacktestService`.

### `backtest/mapper/TradingRecordMapper.java`

Mapper chuyển từ TA4J sang domain model.

Nhiệm vụ:

- Duyệt `TradingRecord.getPositions()`.
- Lấy entry order và exit order của từng position.
- Đọc giá và thời gian từ `series.getBar(index)`.
- Tính `profitPercent` theo công thức:

```text
(exitPrice - entryPrice) / entryPrice * 100
```

- Bỏ qua position chưa đóng hoặc dữ liệu không hợp lệ.

Sử dụng khi:

- Cần chuyển kết quả TA4J sang output nghiệp vụ cho application layer hoặc API layer.

### `backtest/exception/BacktestException.java`

Exception gốc của module backtest.

Nhiệm vụ:

- Đại diện cho lỗi runtime riêng của backtest.
- Giúp phân biệt lỗi backtest với lỗi hệ thống khác.

Sử dụng khi:

- Backtest không có dữ liệu hợp lệ để chạy.
- Cần báo lỗi nghiệp vụ rõ ràng hơn `RuntimeException` chung.

## Luồng chạy thực tế

```text
BacktestCommand
    ↓
BacktestService
    ↓
MarketDataService.load(request, warmupBars)
    ↓
StrategyFactoryRegistry.getFactory(type)
    ↓
TradingStrategyFactory.build(series, parameters)
    ↓
BacktestEngine.run(series, strategy)
    ↓
TradingRecordMapper.toResult(record, series)
    ↓
BacktestResult
```

## Ghi chú thiết kế

- `backtest` không tạo DTO API.
- `backtest` không gọi trực tiếp market provider.
- `backtest` không tính metric phức tạp ngoài profit per trade.
- `backtest` giữ trách nhiệm hẹp để dễ test và dễ thay thế engine.

## Khi mở rộng module

Nếu sau này cần thêm tính năng như metric, equity curve, hoặc report, nên tạo package mới trong `backtest` thay vì nhét toàn bộ logic vào `BacktestService`.