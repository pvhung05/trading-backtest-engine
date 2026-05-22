# AUTH_AND_API

Tài liệu này mô tả phần xác thực và API auth của backend `backtest-trading`. Nội dung tách riêng với tài liệu market hiện có để dễ đọc, dễ bảo trì và dễ sync với OpenAPI.

---

## 1. Mục tiêu

Auth stack hiện tại dùng:
- Spring Security để bảo vệ endpoint
- Spring Data JPA + Hibernate để lưu user
- BCrypt để hash password
- JWT để cấp token stateless

Luồng cơ bản:
1. User đăng ký qua `/api/auth/register`
2. Hệ thống lưu user vào bảng `users`
3. Hệ thống trả JWT ngay sau khi register
4. User đăng nhập qua `/api/auth/login`
5. Client gửi token qua header `Authorization: Bearer <token>`
6. Endpoint `/api/auth/me` trả thông tin user hiện tại

---

## 2. Package chính

| Package | Vai trò |
|---|---|
| `com.trading.apps.api.controller.auth` | REST controller cho endpoint auth |
| `com.trading.apps.api.request.auth` | DTO input cho register/login |
| `com.trading.apps.api.response.auth` | DTO output cho auth |
| `com.trading.apps.auth.entity` | Entity và enum lưu trong database |
| `com.trading.apps.auth.repository` | JPA repository |
| `com.trading.apps.auth.service` | Business logic |
| `com.trading.apps.auth.security` | JWT, filter, user details, security config |
| `com.trading.apps.auth.exception` | Exception domain cho auth |

---

## 3. Model dữ liệu

### 3.1 `AppUser`

Entity đại diện user trong bảng `users`.

| Field | Ý nghĩa |
|---|---|
| `id` | Khóa chính |
| `username` | Tên đăng nhập, unique |
| `email` | Email, unique |
| `passwordHash` | Password đã mã hóa bằng BCrypt |
| `role` | Vai trò hiện tại, mặc định `USER` |
| `enabled` | Cho phép đăng nhập hay không |
| `createdAt` | Thời điểm tạo |
| `updatedAt` | Thời điểm cập nhật gần nhất |

### 3.2 `Role`

Hiện tại có 2 giá trị:
- `USER`
- `ADMIN`

### 3.3 Request/Response DTO

`RegisterRequest`:
- `username`: bắt buộc, 3-50 ký tự
- `email`: bắt buộc, đúng định dạng email
- `password`: bắt buộc, tối thiểu 8 ký tự

`LoginRequest`:
- `username`: bắt buộc
- `password`: bắt buộc

`UserResponse`:
- `id`
- `username`
- `email`
- `role`
- `enabled`
- `createdAt`

`AuthResponse`:
- `token`
- `tokenType`
- `user`

---

## 4. Endpoint Auth

### 4.1 `POST /api/auth/register`

Tạo user mới, hash mật khẩu bằng BCrypt và trả về JWT ngay sau khi tạo thành công.

Request body:
```json
{
  "username": "hungpham",
  "email": "hung@example.com",
  "password": "strongpassword123"
}
```

Kết quả thành công:
- HTTP `201 Created`
- Trả về `AuthResponse`

Các lỗi thường gặp:
- `400 Bad Request`: validate fail
- `409 Conflict`: username hoặc email đã tồn tại

### 4.2 `POST /api/auth/login`

Xác thực user bằng username/password, sau đó trả JWT mới.

Request body:
```json
{
  "username": "hungpham",
  "password": "strongpassword123"
}
```

Kết quả thành công:
- HTTP `200 OK`
- Trả về `AuthResponse`

Các lỗi thường gặp:
- `400 Bad Request`: validate fail
- `401 Unauthorized`: sai username hoặc password

### 4.3 `GET /api/auth/me`

Trả về thông tin user hiện tại từ JWT trong header `Authorization`.

Header bắt buộc:
```http
Authorization: Bearer <token>
```

Kết quả thành công:
- HTTP `200 OK`
- Trả về `UserResponse`

Các lỗi thường gặp:
- `401 Unauthorized`: thiếu token, token sai hoặc token hết hạn

---

## 5. Security flow

### 5.1 `SecurityConfig`

Config hiện tại:
- Tắt `session` để chạy stateless
- Bật `BCryptPasswordEncoder`
- Cho phép public các endpoint `/api/auth/register` và `/api/auth/login`
- Yêu cầu xác thực cho `/api/auth/me`
- Gắn `JwtAuthenticationFilter` trước `UsernamePasswordAuthenticationFilter`

### 5.2 `JwtService`

Nhiệm vụ:
- Sinh JWT từ `UserDetails`
- Lấy username từ token
- Kiểm tra token còn hạn hay không

### 5.3 `JwtAuthenticationFilter`

Filter đọc header `Authorization`:
1. Kiểm tra prefix `Bearer `
2. Tách token
3. Parse username từ token
4. Load user từ database
5. Nếu token hợp lệ thì set `SecurityContext`

### 5.4 `CustomUserDetailsService`

Chuyển user trong database sang `UserDetails` để Spring Security sử dụng.

---

## 6. Xử lý lỗi

`AuthExceptionHandler` map lỗi auth về HTTP status rõ ràng:

| Exception | HTTP status | Ý nghĩa |
|---|---|---|
| `UsernameAlreadyExistsException` | `409 Conflict` | Trùng username hoặc email |
| `InvalidCredentialsException` | `401 Unauthorized` | Sai thông tin đăng nhập |
| `MethodArgumentNotValidException` | `400 Bad Request` | Validate request fail |

---

## 7. Cấu hình môi trường

Thông số local đang nằm ở `application-local.properties`:
- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `app.jwt.secret`
- `app.jwt.expiration-ms`

File này nên được giữ local và không commit nếu chứa secret thật.

---

## 8. Ghi chú triển khai

- JWT hiện tại là access token đơn giản, chưa có refresh token.
- Endpoint market đang public theo security config hiện tại.
- Nếu muốn bảo vệ toàn bộ API bằng JWT, chỉ cần đổi `permitAll()` của `/api/market/**` sang `authenticated()`.

---

## 9. Ví dụ dùng API

Đăng ký:
```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"hungpham","email":"hung@example.com","password":"strongpassword123"}'
```

Gọi API có bảo vệ:
```bash
curl http://localhost:8081/api/auth/me \
  -H "Authorization: Bearer <token>"
```
