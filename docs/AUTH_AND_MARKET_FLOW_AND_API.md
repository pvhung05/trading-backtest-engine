# AUTH_AND_MARKET_FLOW_AND_API

Tài liệu này mô tả luồng hoạt động hiện tại của `auth` và `market` trong backend `backtest-trading`, đồng thời nêu cách xây dựng API tương ứng cho từng module.

---

## 1. Tổng quan kiến trúc

Backend đang tách theo 3 lớp chính:
- `api`: controller, request/response DTO, mapper, exception handler
- `auth` hoặc `market`: business logic, entity/model, repository, security/provider
- `security`: JWT, filter, `UserDetailsService`, `SecurityConfig`

Mục tiêu chung:
- `auth` chịu trách nhiệm đăng ký, đăng nhập, cấp JWT, lấy user hiện tại
- `market` chịu trách nhiệm tải dữ liệu thị trường, cache dữ liệu, trả series cho backtest

---

## 2. Luồng hoạt động của `auth`

### 2.1 Thành phần chính

| Thành phần | Vai trò |
|---|---|
| [AuthController](../backend/backtest-trading/src/main/java/com/trading/apps/api/controller/auth/AuthController.java) | Cửa vào REST cho register, login, me |
| [AuthService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/service/AuthService.java) | Business logic của auth |
| [AppUser](../backend/backtest-trading/src/main/java/com/trading/apps/auth/entity/AppUser.java) | Entity user lưu trong bảng `users` |
| [Role](../backend/backtest-trading/src/main/java/com/trading/apps/auth/enums/Role.java) | Enum vai trò người dùng |
| [UserRepository](../backend/backtest-trading/src/main/java/com/trading/apps/auth/repository/UserRepository.java) | JPA repository cho user |
| [CustomUserDetailsService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/CustomUserDetailsService.java) | Load user từ DB cho Spring Security |
| [UserPrincipal](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/UserPrincipal.java) | Adapter từ `AppUser` sang `UserDetails` |
| [JwtService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/JwtService.java) | Sinh và kiểm tra JWT |
| [JwtAuthenticationFilter](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/JwtAuthenticationFilter.java) | Đọc token từ header và set `SecurityContext` |
| [SecurityConfig](../backend/backtest-trading/src/main/java/com/trading/apps/auth/config/SecurityConfig.java) | Cấu hình bảo vệ endpoint |
| [AuthExceptionHandler](../backend/backtest-trading/src/main/java/com/trading/apps/api/exception/auth/AuthExceptionHandler.java) | Chuẩn hóa lỗi HTTP |

### 2.2 Luồng đăng ký

1. Client gọi `POST /api/auth/register`.
2. [AuthController](../backend/backtest-trading/src/main/java/com/trading/apps/api/controller/auth/AuthController.java) nhận [RegisterRequest](../backend/backtest-trading/src/main/java/com/trading/apps/api/request/auth/RegisterRequest.java), rồi validate bằng Jakarta Validation.
3. [AuthService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/service/AuthService.java) kiểm tra trùng username hoặc email qua [UserRepository](../backend/backtest-trading/src/main/java/com/trading/apps/auth/repository/UserRepository.java).
4. Nếu hợp lệ, service tạo [AppUser](../backend/backtest-trading/src/main/java/com/trading/apps/auth/entity/AppUser.java), hash password bằng `PasswordEncoder`, và gán role mặc định `USER`.
5. User được lưu xuống database.
6. Service tạo JWT bằng [JwtService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/JwtService.java) thông qua [UserPrincipal](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/UserPrincipal.java).
7. API trả về [AuthResponse](../backend/backtest-trading/src/main/java/com/trading/apps/api/response/auth/AuthResponse.java) gồm token, token type và thông tin user.

### 2.3 Luồng đăng nhập

1. Client gọi `POST /api/auth/login`.
2. [AuthController](../backend/backtest-trading/src/main/java/com/trading/apps/api/controller/auth/AuthController.java) nhận [LoginRequest](../backend/backtest-trading/src/main/java/com/trading/apps/api/request/auth/LoginRequest.java) và validate.
3. [AuthService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/service/AuthService.java) gọi `AuthenticationManager.authenticate(...)` với username/password.
4. `DaoAuthenticationProvider` trong [SecurityConfig](../backend/backtest-trading/src/main/java/com/trading/apps/auth/config/SecurityConfig.java) dùng [CustomUserDetailsService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/CustomUserDetailsService.java) để lấy user, rồi so password hash bằng BCrypt.
5. Nếu xác thực thành công, service load lại user từ DB và sinh JWT mới.
6. API trả về [AuthResponse](../backend/backtest-trading/src/main/java/com/trading/apps/api/response/auth/AuthResponse.java).

### 2.4 Luồng lấy user hiện tại

1. Client gọi `GET /api/auth/me` kèm header `Authorization: Bearer <token>`.
2. [JwtAuthenticationFilter](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/JwtAuthenticationFilter.java) chạy trước các filter xác thực khác.
3. Filter tách token, lấy username, load user từ DB, kiểm tra token hợp lệ bằng [JwtService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/JwtService.java).
4. Nếu hợp lệ, filter set `Authentication` vào `SecurityContextHolder`.
5. [AuthController](../backend/backtest-trading/src/main/java/com/trading/apps/api/controller/auth/AuthController.java) nhận `@AuthenticationPrincipal UserPrincipal` và trả [UserResponse](../backend/backtest-trading/src/main/java/com/trading/apps/api/response/auth/UserResponse.java).

### 2.5 Cách xây API cho `auth`

Nếu cần tạo hoặc mở rộng API auth, nên đi theo cấu trúc này:

1. Định nghĩa request DTO ở `com.trading.apps.api.request.auth`.
2. Định nghĩa response DTO ở `com.trading.apps.api.response.auth`.
3. Tạo endpoint trong [AuthController](../backend/backtest-trading/src/main/java/com/trading/apps/api/controller/auth/AuthController.java).
4. Đặt logic nghiệp vụ trong [AuthService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/service/AuthService.java), không nhét vào controller.
5. Dùng [UserRepository](../backend/backtest-trading/src/main/java/com/trading/apps/auth/repository/UserRepository.java) để truy cập DB.
6. Nếu cần security, để [JwtService](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/JwtService.java) và [JwtAuthenticationFilter](../backend/backtest-trading/src/main/java/com/trading/apps/auth/security/JwtAuthenticationFilter.java) xử lý token.
7. Map lỗi về HTTP status bằng [AuthExceptionHandler](../backend/backtest-trading/src/main/java/com/trading/apps/api/exception/auth/AuthExceptionHandler.java).

### 2.6 API hiện có của `auth`

| API | Mục đích | Status chính |
|---|---|---|
| `POST /api/auth/register` | Tạo user mới và trả JWT | `201 Created` |
| `POST /api/auth/login` | Xác thực username/password và trả JWT | `200 OK` |
| `GET /api/auth/me` | Lấy thông tin user hiện tại từ token | `200 OK` |

### 2.7 Lỗi tiêu biểu của `auth`

| Exception | HTTP status | Ý nghĩa |
|---|---|---|
| `UsernameAlreadyExistsException` | `409 Conflict` | Trùng username hoặc email |
| `InvalidCredentialsException` | `401 Unauthorized` | Sai username hoặc password |
| `MethodArgumentNotValidException` | `400 Bad Request` | Request body không hợp lệ |

---

## 3. Luồng hoạt động của `market`

### 3.1 Thành phần chính

| Thành phần | Vai trò |
|---|---|
| [MarketDataController](../backend/backtest-trading/src/main/java/com/trading/apps/api/controller/market/MarketDataController.java) | REST API cho market |
| [MarketDataService](../backend/backtest-trading/src/main/java/com/trading/apps/market/service/MarketDataService.java) | Điều phối load, cache, merge, slice data |
| [MarketDataRequest](../backend/backtest-trading/src/main/java/com/trading/apps/market/model/MarketDataRequest.java) | Model domain của request market |
| [MarketDataLoadRequest](../backend/backtest-trading/src/main/java/com/trading/apps/api/request/market/MarketDataLoadRequest.java) | Query DTO từ API |
| [MarketDataProvider](../backend/backtest-trading/src/main/java/com/trading/apps/market/provider/MarketDataProvider.java) | Interface lấy dữ liệu từ nguồn ngoài |
| [BinanceMarketDataProvider](../backend/backtest-trading/src/main/java/com/trading/apps/market/provider/BinanceMarketDataProvider.java) | Provider cụ thể cho Binance |
| [MarketDataCache](../backend/backtest-trading/src/main/java/com/trading/apps/market/cache/MarketDataCache.java) | Cache in-memory |
| [CacheKeyGenerator](../backend/backtest-trading/src/main/java/com/trading/apps/market/cache/CacheKeyGenerator.java) | Tạo key cache theo symbol-timeframe |
| [SeriesSlicer](../backend/backtest-trading/src/main/java/com/trading/apps/market/slicer/SeriesSlicer.java) | Cắt BarSeries theo khoảng thời gian |
| [MarketDataResponseMapper](../backend/backtest-trading/src/main/java/com/trading/apps/api/mapper/market/MarketDataResponseMapper.java) | Map domain series sang JSON response |
| [MarketCacheResponseMapper](../backend/backtest-trading/src/main/java/com/trading/apps/api/mapper/market/MarketCacheResponseMapper.java) | Map cache snapshot sang JSON response |
| [MarketDataExceptionHandler](../backend/backtest-trading/src/main/java/com/trading/apps/api/exception/market/MarketDataExceptionHandler.java) | Chuẩn hóa lỗi market |

### 3.2 Luồng tải dữ liệu market

1. Client gọi `GET /api/market/load` với query params `symbol`, `timeframe`, `startTime`, `endTime`.
2. [MarketDataController](../backend/backtest-trading/src/main/java/com/trading/apps/api/controller/market/MarketDataController.java) nhận [MarketDataLoadRequest](../backend/backtest-trading/src/main/java/com/trading/apps/api/request/market/MarketDataLoadRequest.java).
3. Request được normalize sang [MarketDataRequest](../backend/backtest-trading/src/main/java/com/trading/apps/market/model/MarketDataRequest.java):
   - `symbol` đổi sang uppercase
   - `timeframe` đổi sang lowercase
   - `startTime` và `endTime` parse thành `Instant`
   - `endTime` rỗng thì mặc định là `Instant.now()`
4. [MarketDataService](../backend/backtest-trading/src/main/java/com/trading/apps/market/service/MarketDataService.java) tạo cache key theo `SYMBOL-TIMEFRAME`.
5. Service kiểm tra cache:
   - cache hit thì dùng dữ liệu đã có
   - cache miss thì gọi [MarketDataProvider](../backend/backtest-trading/src/main/java/com/trading/apps/market/provider/MarketDataProvider.java)
6. Nếu request vượt khỏi dữ liệu cache hiện tại, service mở rộng data bằng cách tải thêm phần thiếu ở đầu hoặc cuối.
7. Dữ liệu được merge thành `BarSeries` mới, lưu lại vào cache nếu có thay đổi.
8. [SeriesSlicer](../backend/backtest-trading/src/main/java/com/trading/apps/market/slicer/SeriesSlicer.java) cắt series đúng khoảng thời gian yêu cầu.
9. [MarketDataResponseMapper](../backend/backtest-trading/src/main/java/com/trading/apps/api/mapper/market/MarketDataResponseMapper.java) map kết quả sang [MarketDataResponse](../backend/backtest-trading/src/main/java/com/trading/apps/api/response/market/MarketDataResponse.java).

### 3.3 Luồng xem và xóa cache

1. Client gọi `GET /api/market/cache`.
2. [MarketDataController](../backend/backtest-trading/src/main/java/com/trading/apps/api/controller/market/MarketDataController.java) lấy snapshot từ [MarketDataService](../backend/backtest-trading/src/main/java/com/trading/apps/market/service/MarketDataService.java).
3. [MarketCacheResponseMapper](../backend/backtest-trading/src/main/java/com/trading/apps/api/mapper/market/MarketCacheResponseMapper.java) trả [MarketCacheResponse](../backend/backtest-trading/src/main/java/com/trading/apps/api/response/market/MarketCacheResponse.java).
4. Client gọi `DELETE /api/market/cache` để xóa toàn bộ cache.

### 3.4 Cách xây API cho `market`

Nếu cần tạo hoặc mở rộng API market, nên đi theo cấu trúc này:

1. Định nghĩa request DTO ở `com.trading.apps.api.request.market`.
2. Định nghĩa response DTO ở `com.trading.apps.api.response.market`.
3. Tạo controller trong `com.trading.apps.api.controller.market`.
4. Chuyển request API sang model domain ở tầng `api` hoặc `service`.
5. Đặt toàn bộ logic tải/cache/merge/slice trong [MarketDataService](../backend/backtest-trading/src/main/java/com/trading/apps/market/service/MarketDataService.java).
6. Để provider riêng chịu trách nhiệm gọi nguồn dữ liệu bên ngoài, ví dụ Binance.
7. Dùng mapper để chuyển domain object sang JSON response.
8. Chuẩn hóa lỗi bằng [MarketDataExceptionHandler](../backend/backtest-trading/src/main/java/com/trading/apps/api/exception/market/MarketDataExceptionHandler.java).

### 3.5 API hiện có của `market`

| API | Mục đích | Status chính |
|---|---|---|
| `GET /api/market/load` | Tải dữ liệu thị trường theo symbol/timeframe/khoảng thời gian | `200 OK` |
| `GET /api/market/cache` | Xem trạng thái cache hiện tại | `200 OK` |
| `DELETE /api/market/cache` | Xóa toàn bộ cache | `204 No Content` |

### 3.6 Lỗi tiêu biểu của `market`

| Exception | HTTP status | Ý nghĩa |
|---|---|---|
| `IllegalArgumentException` | `400 Bad Request` | Thiếu field, sai định dạng thời gian, unsupported timeframe |
| `MarketDataException` | `502 Bad Gateway` | Lỗi từ provider hoặc nguồn dữ liệu ngoài |

### 3.7 Security của `market`

Theo [SecurityConfig](../backend/backtest-trading/src/main/java/com/trading/apps/auth/config/SecurityConfig.java), các endpoint `market` hiện đang yêu cầu xác thực JWT qua `.authenticated()`.

---

## 4. Mẫu triển khai API mới

Khi thêm API mới cho một module trong dự án này, có thể bám theo mẫu sau:

1. Tạo request DTO ở package `api.request`.
2. Tạo response DTO ở package `api.response`.
3. Viết controller chỉ làm nhiệm vụ nhận input và trả output.
4. Đưa business logic vào service.
5. Dùng repository cho truy cập database, provider cho nguồn ngoài.
6. Dùng mapper nếu response cần chuyển đổi từ domain sang JSON.
7. Dùng `@RestControllerAdvice` để map lỗi về HTTP status rõ ràng.
8. Nếu endpoint cần bảo vệ, cập nhật `SecurityConfig` và luồng JWT.

---

## 5. Ghi chú ngắn

- Auth và market đều đang đi theo hướng stateless.
- `auth` cấp token, `market` dùng token để bảo vệ API.
- `market` hiện cache trong memory, nên dữ liệu sẽ mất khi app restart.
- Nếu sau này muốn public `market`, chỉ cần đổi cấu hình trong [SecurityConfig](../backend/backtest-trading/src/main/java/com/trading/apps/auth/config/SecurityConfig.java) từ `.authenticated()` sang `.permitAll()` cho `/api/market/**`.
