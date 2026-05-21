# Tài liệu module `market` (tóm tắt tiếng Việt)

Mục tiêu: mô tả các file chính trong package `com.trading.apps.market`, liệt kê hàm/phương thức quan trọng, cách sử dụng và nhiệm vụ chính của từng thành phần.

---

## 1. `market/cache/MarketDataCache.java`
Mô tả: cache in-memory dùng `ConcurrentHashMap` để lưu `BarSeries` theo key `SYMBOL-TIMEFRAME`.

| Hàm | Cách sử dụng | Nhiệm vụ |
|---|---|---|
| `put(String key, BarSeries series)` | `cache.put(key, series)` | Lưu hoặc ghi đè `BarSeries` cho key tương ứng. |
| `Optional<BarSeries> get(String key)` | `cache.get(key).ifPresent(...)` | Lấy series nếu có; trả `Optional.empty()` khi không tồn tại. |
| `boolean contains(String key)` | `if (cache.contains(key)) ...` | Kiểm tra tồn tại key. |
| `void remove(String key)` | `cache.remove(key)` | Xóa một entry cụ thể (nếu được hỗ trợ). |
| `void clear()` | `cache.clear()` | Xóa toàn bộ cache. |
| `Set<String> keys()` / `int size()` | `cache.keys()` / `cache.size()` | Lấy danh sách key hoặc kích thước cache. |

Lưu ý vận hành: coi `BarSeries` đã lưu là bất biến (immutable) hoặc dùng copy-on-write khi cần cập nhật để tránh race condition giữa các thread.

---

## 2. `market/cache/CacheKeyGenerator.java`
Mô tả: tiện ích tạo key chuẩn cho cache.

| Hàm | Cách sử dụng | Nhiệm vụ |
|---|---|---|
| `static String generateKey(String symbol, String timeframe)` | `CacheKeyGenerator.generateKey("BTCUSDT","5m")` | Chuẩn hoá và ghép `SYMBOL-TIMEFRAME` làm key. Giữ định dạng thống nhất giữa controller và service. |

---

## 3. `market/model/MarketDataRequest.java`
Mô tả: đối tượng domain biểu diễn yêu cầu (symbol, timeframe, startTime, endTime).

| Thành phần / Hàm | Cách sử dụng | Nhiệm vụ |
|---|---|---|
| Constructor / getters | Tạo từ `MarketDataLoadRequest` trong controller | Chứa thông tin đầu vào đã parse, dùng để gọi service/provider. |

---

## 4. `market/model/MarketDataCacheSnapshot.java`
Mô tả: record/POJO bất biến để báo cáo metadata của một entry trong cache (key, symbol, timeframe, start, end, barCount).

| Thành phần | Cách sử dụng | Nhiệm vụ |
|---|---|---|
| Constructor / accessors | Tạo từ `MarketDataService.getCacheSnapshots()` | Dùng để build API response cho `GET /api/market/cache`. |

---

## 5. `market/service/MarketDataService.java`
Mô tả: lớp điều phối chính — kiểm tra cache, gọi provider khi cần, thực hiện gap-filling (prepend/append), merge series và trả về lát cắt theo yêu cầu.

Các hàm quan trọng:

| Hàm | Cách sử dụng | Nhiệm vụ |
|---|---|---|
| `BarSeries load(MarketDataRequest request)` | Gọi từ controller để tải dữ liệu | Entry point: đọc cache, mở rộng nếu cần, trả về `BarSeries` đã slice theo `start..end`. |
| `private BarSeries extendCachedSeriesIfNeeded(String key, BarSeries cached, MarketDataRequest req)` | Gọi nội bộ từ `load()` | Kiểm tra head/tail gap và gọi `prependMissingBars`/`appendMissingBars`. Nếu thay đổi, cập nhật cache. |
| `private BarSeries prependMissingBars(...)` | Nội bộ | Tạo sub-request cho phần thiếu ở đầu, gọi provider, merge kết quả vào trước cached. |
| `private BarSeries appendMissingBars(...)` | Nội bộ | Tạo sub-request cho phần thiếu ở cuối, gọi provider, merge kết quả vào sau cached. |
| `private BarSeries mergeSeries(BarSeries a, BarSeries b)` | Nội bộ | Tạo series mới chứa bars từ `a` và `b`, loại trùng theo `endTime()`. |
| `private void addBarsIfMissing(...)` | Nội bộ | Thêm bar từ nguồn vào target nếu chưa tồn tại (bằng endTime). |
| `public void clearCache()` | Gọi từ admin/controller | Xóa toàn bộ cache. |
| `public List<MarketDataCacheSnapshot> getCacheSnapshots()` | Gọi từ controller | Liệt kê metadata các entry cache để trả API. |

Ghi chú:
- Gap-filling (incremental extension): khi cached chỉ có 2022–2024 và client yêu cầu 2022–2026, service sẽ chỉ tải phần 2024+1 .. 2026 (append) và merge, không tải lại toàn bộ.
- Hành vi tương tự cho prepend khi request bắt đầu trước cached.first.

---

## 6. `market/provider/*` (ví dụ: `BinanceMarketDataProvider`, `BinanceApiLoader`)
Mô tả: lớp abstraction provider và cài đặt thực tế tương tác API bên ngoài (Binance). Chịu trách nhiệm chuyển đổi dữ liệu raw → `BarSeries`.

| Hàm | Cách sử dụng | Nhiệm vụ |
|---|---|---|
| `BarSeries provide(MarketDataRequest request)` | Gọi từ `MarketDataService` khi cần dữ liệu mới | Tải candle trong khoảng `start..end`, chuyển thành `BarSeries`. |
| `List<Candle> loadCandles(String symbol, String timeframe, Instant start, Instant end)` | Nội bộ provider/loader | Gọi REST API exchange, xử lý paging, parse klines thành `Candle`. |

Lưu ý: provider cần xử lý rate-limit, paging và trả lỗi có ý nghĩa (ví dụ ném `MarketDataException`) để service/handler map thành HTTP 502.

---

## 7. `market/mapper/CandleMapper.java`
Mô tả: chuyển `Candle` (domain raw) → `ta4j.BarSeries`.

| Hàm | Cách sử dụng | Nhiệm vụ |
|---|---|---|
| `static BarSeries toBarSeries(List<Candle> candles, String symbol, String timeframe)` | Gọi sau khi nhận list `Candle` từ provider | Chuyển danh sách candle thành `BarSeries` đúng thứ tự thời gian và timezone. |

---

## 8. `market/slicer/SeriesSlicer.java`
Mô tả: cắt một `BarSeries` lớn theo khoảng thời gian `[start,end]` để trả chính xác cho client.

| Hàm | Cách sử dụng | Nhiệm vụ |
|---|---|---|
| `static BarSeries slice(BarSeries fullSeries, Instant start, Instant end)` | Gọi sau bước merge/hoặc lấy trực tiếp từ cache | Trả series chỉ gồm các bar có `endTime` nằm trong khoảng. |

---

## 9. Các util & model nhỏ
- `TimeframeUtil`: kiểm tra timeframes được hỗ trợ (`isSupported`).
- `Candle`: POJO bất biến chứa `open, high, low, close, volume, endTime`.

---

## 10. Khuyến nghị vận hành ngắn
- Đảm bảo không sửa trực tiếp `BarSeries` sau khi put vào cache; nếu cần cập nhật, build series mới và `put` lại.  
- Thêm unit test cho hành vi prepend/append và test concurrency trên cache.  
- Ghi log khi thực hiện prepend/append (khoảng thời gian được tải) để phục vụ debug.

---

Nếu bạn muốn, tôi có thể: 1) mở rộng tài liệu này thành bảng chi tiết hơn cho mỗi file code cụ thể (kèm đường dẫn file), hoặc 2) sinh file OpenAPI cho API dựa trên các endpoint hiện có.
