# Thiết Kế Sơ Đồ UML Chi Tiết — Trading Backtest Engine

> **Dự án:** Trading Backtest Engine (Nền tảng kiểm thử chiến lược giao dịch & Mạng xã hội đầu tư)  
> **Kiến trúc:** Microservices (API Gateway, Auth Service, Realtime Service, Backtest Service, Community Service)  
> **Mục đích:** Tài liệu thiết kế kỹ thuật phần mềm chi tiết, phục vụ Báo cáo Khóa luận Tốt nghiệp & Hiện thực hóa mã nguồn  
> **Chuẩn ký hiệu:** UML 2.5 (Unified Modeling Language) qua cú pháp Mermaid

---

## MỤC LỤC

1. [Tổng Quan Kiến Trúc & Danh Mục Sơ Đồ UML](#1-tổng-quan-kiến-trúc--danh-mục-sơ-đồ-uml)
2. [Sơ Đồ Use Case (Use Case Diagrams)](#2-sơ-đồ-use-case-use-case-diagrams)
   - 2.1 Sơ đồ Use Case tổng thể toàn hệ thống
   - 2.2 Sơ đồ Use Case phân hệ Xác thực & Quản lý Tài khoản (Auth Service)
   - 2.3 Sơ đồ Use Case phân hệ Dữ liệu Thị trường Thời gian thực (Realtime Service)
   - 2.4 Sơ đồ Use Case phân hệ Động cơ Kiểm thử Chiến lược (Backtest Engine Service)
   - 2.5 Sơ đồ Use Case phân hệ Mạng Xã Hội Giao Dịch & Cộng Đồng (Community Service)
3. [Sơ Đồ Lớp (Class Diagrams)](#3-sơ-đồ-lớp-class-diagrams)
   - 3.1 Sơ đồ Lớp phân hệ Backtest Engine (Domain Entities, Models & Engine Services)
   - 3.2 Sơ đồ Lớp phân hệ Mạng Xã Hội Đầu Tư (Community Entities & Domain Model)
   - 3.3 Sơ đồ Lớp phân hệ Xác thực & Dữ liệu Thị trường (Auth & Realtime Service)
4. [Sơ Đồ Tuần Tự (Sequence Diagrams)](#4-sơ-đồ-tuần-tự-sequence-diagrams)
   - 4.1 Luồng Xác thực Đăng nhập & Điều hướng JWT qua API Gateway
   - 4.2 Luồng Đăng ký Nhận Stream Nến Thời Gian Thực qua WebSocket STOMP
   - 4.3 Luồng Thực thi Kiểm thử Chiến lược Toàn diện (Full Simulation Pipeline)
   - 4.4 Luồng Đăng Ý tưởng Giao dịch & Phát Sinh Thông báo Tương tác
5. [Sơ Đồ Hoạt Động (Activity Diagrams)](#5-sơ-đồ-hoạt-động-activity-diagrams)
   - 5.1 Lưu đồ Thuật toán Động cơ Kiểm thử Chiến lược Từng Nến (Candle-by-Candle Simulation)
   - 5.2 Quy trình Gia nhập & Phê duyệt Thành viên Nhóm Cộng đồng
6. [Sơ Đồ Trạng Thái (State Machine Diagrams)](#6-sơ-đồ-trạng-thái-state-machine-diagrams)
   - 6.1 Vòng đời Phiên chạy Backtest (`BacktestRun`)
   - 6.2 Vòng đời Vị thế Lệnh Giao dịch (`TradeRecord`)
   - 6.3 Vòng đời Quan hệ Bạn bè & Trạng thái Thành viên Nhóm
7. [Sơ Đồ Thành Phần & Triển Khai (Component & Deployment Diagrams)](#7-sơ-đồ-thành-phần--triển-khai-component--deployment-diagrams)
   - 7.1 Sơ đồ Thành phần (Component Diagram)
   - 7.2 Sơ đồ Triển khai Vật lý (Deployment Diagram)

---

## 1. TỔNG QUAN KIẾN TRÚC & DANH MỤC SƠ ĐỒ UML

Hệ thống **Trading Backtest Engine** được thiết kế theo kiến trúc Microservices phân tán với các thành phần cốt lõi:
- **Client Tier**: Ứng dụng Single-Page Application (React, Vite, TypeScript, TailwindCSS, TradingView Lightweight Charts).
- **Gateway Tier**: API Gateway (Spring Cloud Gateway, Port 8080) làm điểm đón duy nhất, chịu trách nhiệm Reverse Proxy, CORS, Load Balancing, bảo mật.
- **Service Tier**:
  1. `auth-service` (Port 8081): Quản lý người dùng, mã hóa mật khẩu BCrypt, cấp phát và xác thực JWT token.
  2. `realtime-service` (Port 8082): Tích hợp Binance REST/WebSocket API, stream nến Candlestick thời gian thực tới frontend qua WebSocket STOMP (`/ws/market`).
  3. `backtest-service` (Port 8083): Động cơ tính toán tài chính cốt lõi (Core Engine) dựa trên thư viện phân tích kỹ thuật `ta4j`, mô phỏng trượt giá (slippage), phí giao dịch (commission), phân bổ vốn (portfolio) và 22 chỉ số thống kê tài chính chuẩn mực (Sharpe, Sortino, Calmar, Max Drawdown,...).
  4. `community-service` (Port 8084): Mạng xã hội đầu tư tài chính với Ý tưởng giao dịch (Trading Ideas), bài viết (Posts), tương tác cảm xúc, bình luận phân cấp, kết bạn, nhóm và hệ thống thông báo realtime.
- **Persistence Tier**: Cơ sở dữ liệu quan hệ MySQL 8.0 (`backtest_trading_system`) quản lý giao dịch ACID và toàn vẹn dữ liệu.

---

## 2. SƠ ĐỒ USE CASE (USE CASE DIAGRAMS)

### 2.1 Sơ đồ Use Case Tổng Thể Toàn Hệ Thống

Sơ đồ tổng quan toàn bộ hệ thống phân chia theo 4 phân hệ Microservices chính, hiển thị từ trái sang phải với các tác nhân (Actors) và mối quan hệ `<<include>>`, `<<extend>>` giữa các ca sử dụng:

```mermaid
flowchart LR
    %% Actors
    subgraph Actors_Left ["Tác Nhân (Actors)"]
        direction TB
        ActorGuest["👤 Khách\n(Guest)"]
        ActorTrader["📈 Nhà Đầu Tư\n(Trader)"]
        ActorAdmin["🛡️ Quản Trị Viên\n(Admin)"]
    end

    ActorBinance["☁️ Binance Public API\n(External System)"]

    subgraph SystemBoundary ["HỆ THỐNG TRADING BACKTEST ENGINE"]
        direction LR
        
        subgraph Sub_Auth ["Phân Hệ 1: Xác Thực & Tài Khoản (Auth Service)"]
            direction TB
            UC_Reg(["UC-01: Đăng ký tài khoản"])
            UC_Login(["UC-02: Đăng nhập hệ thống"])
            UC_Profile(["UC-03: Xem & Cập nhật Hồ sơ"])
        end

        subgraph Sub_Realtime ["Phân Hệ 2: Dữ Liệu Thị Trường Realtime"]
            direction TB
            UC_Symbols(["UC-04: Tra cứu danh sách cặp tiền"])
            UC_StreamCandles(["UC-05: Xem biểu đồ nến Real-time"])
            UC_Watchlist(["UC-06: Quản lý danh mục theo dõi"])
        end

        subgraph Sub_Backtest ["Phân Hệ 3: Động Cơ Kiểm Thử Backtest"]
            direction TB
            UC_ExecBacktest(["UC-07: Chạy kiểm thử chiến lược"])
            UC_SimulateExec(["UC-08: Mô phỏng khớp lệnh & Phí"]):::inc
            UC_PortfolioEquity(["UC-09: Phân tích đường cong vốn"]):::inc
            UC_Metrics(["UC-10: Đánh giá 22 chỉ số tài chính"]):::inc
            UC_SaveRun(["UC-11: Lưu kết quả phiên"]):::ext
            UC_History(["UC-12: Tra cứu lịch sử phiên"])
        end

        subgraph Sub_Community ["Phân Hệ 4: Mạng Xã Hội Giao Dịch & Cộng Đồng"]
            direction TB
            UC_PostIdea(["UC-13: Đăng ý tưởng giao dịch"])
            UC_SocialFeed(["UC-14: Đăng bài viết & Bảng tin"])
            UC_ReactComment(["UC-15: Tương tác, Like, Bình luận"]):::ext
            UC_FriendFollow(["UC-16: Kết bạn & Theo dõi"])
            UC_Groups(["UC-17: Tạo & Quản trị nhóm"])
            UC_Notify(["UC-18: Nhận thông báo tương tác"])
        end
    end

    %% Guest associations
    ActorGuest --> UC_Reg
    ActorGuest --> UC_Login
    ActorGuest --> UC_Symbols
    ActorGuest --> UC_StreamCandles

    %% Trader associations
    ActorTrader -.->|"«kế thừa»"| ActorGuest
    ActorAdmin -.->|"«kế thừa»"| ActorTrader
    ActorTrader --> UC_Profile
    ActorTrader --> UC_Watchlist
    ActorTrader --> UC_ExecBacktest
    ActorTrader --> UC_History
    ActorTrader --> UC_PostIdea
    ActorTrader --> UC_SocialFeed
    ActorTrader --> UC_FriendFollow
    ActorTrader --> UC_Groups
    ActorTrader --> UC_Notify

    %% Include Relationships (Base -> Included)
    UC_ExecBacktest -.->|"«include»"| UC_SimulateExec
    UC_ExecBacktest -.->|"«include»"| UC_PortfolioEquity
    UC_ExecBacktest -.->|"«include»"| UC_Metrics

    %% Extend Relationships (Extension -> Base)
    UC_SaveRun -.->|"«extend»"| UC_ExecBacktest
    UC_PostIdea -.->|"«extend»"| UC_SaveRun
    UC_ReactComment -.->|"«extend»"| UC_SocialFeed
    UC_ReactComment -.->|"«extend»"| UC_PostIdea

    %% External System associations
    UC_Symbols -.->|REST API| ActorBinance
    UC_StreamCandles -.->|WebSocket / REST| ActorBinance
    UC_ExecBacktest -.->|Tải Klines| ActorBinance

    classDef inc fill:#e0f2fe,stroke:#0284c7,stroke-dasharray: 4 4;
    classDef ext fill:#fef3c7,stroke:#d97706,stroke-dasharray: 4 4;
```

---

### 2.2 Sơ đồ Use Case Phân Hệ Xác Thực & Quản Lý Tài Khoản (Auth Service)

Sơ đồ thể hiện quy trình quản lý danh tính, phân quyền và cấp phát JWT Token theo chiều từ trái sang phải:

```mermaid
flowchart LR
    %% Actors
    subgraph Actors_Auth ["Tác Nhân"]
        direction TB
        Guest["👤 Khách (Guest)"]
        Trader["👤 Người Dùng (Trader)"]
    end

    Trader -.->|"«kế thừa»"| Guest

    subgraph AuthServiceBoundary ["Phân Hệ Xác Thực & Phân Quyền (Auth Service)"]
        direction LR
        
        subgraph PrimaryUC ["Chức Năng Chính"]
            direction TB
            UC_Register(["Đăng ký tài khoản mới"])
            UC_Login(["Đăng nhập hệ thống"])
            UC_GetProfile(["Xem thông tin cá nhân"])
        end

        subgraph IncludedUC ["Thành Phần Thực Thi (Include)"]
            direction TB
            UC_ValidateInput(["Kiểm tra định dạng Email & Password"]):::inc
            UC_CheckDuplicate(["Kiểm tra trùng lặp Email / Username"]):::inc
            UC_HashPassword(["Mã hóa mật khẩu BCrypt"]):::inc
            UC_VerifyCredentials(["Đối soát thông tin đăng nhập"]):::inc
            UC_GenJWT(["Cấp phát Access Token JWT"]):::inc
            UC_VerifyToken(["Xác thực chữ ký Bearer JWT"]):::inc
        end

        subgraph ExtendedUC ["Chức Năng Bổ Sung (Extend)"]
            direction TB
            UC_UpdateProfile(["Cập nhật hồ sơ & Ảnh đại diện"]):::ext
            UC_ChangePassword(["Đổi mật khẩu"]):::ext
            UC_Logout(["Đăng xuất & Hủy Token"]):::ext
        end
    end

    %% Actor Connections
    Guest --> UC_Register
    Guest --> UC_Login
    Trader --> UC_GetProfile

    %% Include Relations (Base Use Case -> Included Sub-step)
    UC_Register -.->|"«include»"| UC_ValidateInput
    UC_Register -.->|"«include»"| UC_CheckDuplicate
    UC_Register -.->|"«include»"| UC_HashPassword

    UC_Login -.->|"«include»"| UC_VerifyCredentials
    UC_Login -.->|"«include»"| UC_GenJWT

    UC_GetProfile -.->|"«include»"| UC_VerifyToken

    %% Extend Relations (Extending Use Case -> Base Use Case)
    UC_UpdateProfile -.->|"«extend»"| UC_GetProfile
    UC_ChangePassword -.->|"«extend»"| UC_GetProfile
    UC_Logout -.->|"«extend»"| UC_Login

    classDef inc fill:#e0f2fe,stroke:#0284c7,stroke-dasharray: 4 4;
    classDef ext fill:#fef3c7,stroke:#d97706,stroke-dasharray: 4 4;
```

---

### 2.3 Sơ đồ Use Case Phân Hệ Dữ Liệu Thị Trường Realtime (Realtime Service)

Sơ đồ mô tả quy trình tiếp nhận và truyền phát dữ liệu thị trường từ Binance Public API đến Trader theo thời gian thực (Left-to-Right):

```mermaid
flowchart LR
    %% Actors
    Trader["👤 Nhà Đầu Tư\n(Trader)"]
    Binance["☁️ Binance Public API\n(REST & WebSocket)"]

    subgraph RealtimeBoundary ["Phân Hệ Dữ Liệu Thị Trường Realtime (Realtime Service)"]
        direction LR
        
        subgraph MarketBase ["Chức Năng Cơ Bản"]
            direction TB
            UC_GetSymbols(["Tra cứu danh sách\ncặp giao dịch (Symbols)"])
            UC_StreamCandles(["Xem biểu đồ nến\nThời gian thực"])
            UC_GetHistory(["Tải lịch sử nến\n(Historical Klines)"])
        end

        subgraph MarketInc ["Thành Phần Bắt Buộc (Include)"]
            direction TB
            UC_SubCandles(["Đăng ký Stream nến\nWebSocket STOMP"]):::inc
            UC_FetchBinanceKline(["Fetch dữ liệu Klines\ntừ Binance REST"]):::inc
        end

        subgraph MarketExt ["Chức Năng Mở Rộng (Extend)"]
            direction TB
            UC_Get24hTickers(["Xem biến động giá 24h\n(24h Price Change)"]):::ext
            UC_Watchlist(["Quản lý danh mục\ntheo dõi yêu thích"]):::ext
            UC_UnsubCandles(["Hủy nhận Stream nến\n(Unsubscribe)"]):::ext
            UC_ChangeInterval(["Thay đổi khung thời gian\n(1m, 5m, 1h, 1d)"]):::ext
        end
    end

    %% Actor Connections
    Trader --> UC_GetSymbols
    Trader --> UC_StreamCandles
    Trader --> UC_GetHistory

    %% Include Relations
    UC_StreamCandles -.->|"«include»"| UC_GetHistory
    UC_StreamCandles -.->|"«include»"| UC_SubCandles
    UC_GetHistory -.->|"«include»"| UC_FetchBinanceKline

    %% Extend Relations
    UC_Get24hTickers -.->|"«extend»"| UC_GetSymbols
    UC_Watchlist -.->|"«extend»"| UC_GetSymbols
    UC_UnsubCandles -.->|"«extend»"| UC_SubCandles
    UC_ChangeInterval -.->|"«extend»"| UC_StreamCandles

    %% External System interactions
    UC_GetSymbols -.->|REST HTTP /exchangeInfo| Binance
    UC_FetchBinanceKline -.->|REST HTTP /klines| Binance
    UC_SubCandles -.->|WSS @kline stream| Binance

    classDef inc fill:#e0f2fe,stroke:#0284c7,stroke-dasharray: 4 4;
    classDef ext fill:#fef3c7,stroke:#d97706,stroke-dasharray: 4 4;
```

---

### 2.4 Sơ đồ Use Case Phân Hệ Động Cơ Kiểm Thử Chiến Lược (Backtest Engine Service)

Sơ đồ quy trình thực thi kiểm thử chiến lược định lượng từ cấu hình tham số, mô phỏng khớp lệnh đến tính toán 22 chỉ số tài chính (Left-to-Right):

```mermaid
flowchart LR
    %% Actors
    Trader["👤 Nhà Đầu Tư\n(Trader)"]
    Binance["☁️ Binance REST API\n(Nguồn nến lịch sử)"]

    subgraph BacktestBoundary ["Phân Hệ Động Cơ Kiểm Thử Chiến Lược (Backtest Service)"]
        direction LR

        subgraph SetupAndExec ["Thiết Lập & Khởi Chạy"]
            direction TB
            UC_ConfigStrategy(["Cấu hình tham số chiến lược\n(SMA Cross, RSI, MACD)"])
            UC_ConfigExecution(["Cấu hình mô phỏng khớp lệnh\n(Vốn, Trượt giá, Phí sàn)"])
            UC_RunFullSim(["Thực thi toàn bộ quy trình Kiểm thử\n(Full Simulation Pipeline)"])
        end

        subgraph SimPipeline ["Các Bước Kiểm Thử Cốt Lõi (Include)"]
            direction TB
            UC_FetchKlines(["Tải nến kèm Warmup bars"]):::inc
            UC_CalcIndicators(["Tính toán chỉ báo kỹ thuật ta4j"]):::inc
            UC_GenerateSignals(["Phát sinh tín hiệu Entry / Exit"]):::inc
            UC_SimulateTrades(["Mô phỏng khớp lệnh & Khấu trừ chi phí"]):::inc
            UC_CalcEquity(["Xây dựng biểu đồ vốn (Equity Curve)"]):::inc
            UC_CalcMetrics(["Tính toán 22 chỉ số tài chính chuẩn"]):::inc
        end

        subgraph StorageAndHistory ["Quản Lý Kết Quả & Lịch Sử (Extend)"]
            direction TB
            UC_ViewHistory(["Tra cứu lịch sử\ncác phiên kiểm thử"])
            UC_SaveBacktest(["Lưu kết quả phiên\nvào CSDL"]):::ext
            UC_ViewDetail(["Xem chi tiết giao dịch\n& Biểu đồ vốn"]):::ext
            UC_DeleteRun(["Xóa phiên kiểm thử"]):::ext
            UC_ExportReport(["Xuất dữ liệu / Báo cáo kiểm thử"]):::ext
        end
    end

    %% Actor Connections
    Trader --> UC_ConfigStrategy
    Trader --> UC_ConfigExecution
    Trader --> UC_RunFullSim
    Trader --> UC_ViewHistory

    %% Include Relations (Quy trình kiểm thử bắt buộc đi qua toàn bộ pipeline)
    UC_RunFullSim -.->|"«include»"| UC_FetchKlines
    UC_RunFullSim -.->|"«include»"| UC_CalcIndicators
    UC_RunFullSim -.->|"«include»"| UC_GenerateSignals
    UC_RunFullSim -.->|"«include»"| UC_SimulateTrades
    UC_RunFullSim -.->|"«include»"| UC_CalcEquity
    UC_RunFullSim -.->|"«include»"| UC_CalcMetrics

    %% Extend Relations (Hành động tùy chọn mở rộng)
    UC_SaveBacktest -.->|"«extend»"| UC_RunFullSim
    UC_ViewDetail -.->|"«extend»"| UC_ViewHistory
    UC_DeleteRun -.->|"«extend»"| UC_ViewHistory
    UC_ExportReport -.->|"«extend»"| UC_ViewDetail

    %% External System interactions
    UC_FetchKlines -.->|REST HTTP /klines| Binance

    classDef inc fill:#e0f2fe,stroke:#0284c7,stroke-dasharray: 4 4;
    classDef ext fill:#fef3c7,stroke:#d97706,stroke-dasharray: 4 4;
```

---

### 2.5 Sơ đồ Use Case Phân Hệ Mạng Xã Hội Giao Dịch & Cộng Đồng (Community Service)

Sơ đồ mô tả các ca sử dụng chia sẻ ý tưởng, bài viết, kết nối bạn bè, hội nhóm và thông báo tương tác (Left-to-Right):

```mermaid
flowchart LR
    %% Actors
    subgraph CommunityActors ["Tác Nhân"]
        direction TB
        Trader["👤 Thành Viên (Trader)"]
        GroupAdmin["🛡️ Quản Trị Nhóm (Group Admin)"]
    end

    GroupAdmin -.->|"«kế thừa»"| Trader

    subgraph CommunityBoundary ["Phân Hệ Mạng Xã Hội Giao Dịch & Cộng Đồng (Community Service)"]
        direction LR

        subgraph Mod_Ideas ["1. Quản Lý Ý Tưởng Giao Dịch (Trading Ideas)"]
            direction TB
            UC_CreateIdea(["Đăng ý tưởng giao dịch"])
            UC_AttachBacktest(["Đính kèm kết quả Backtest / Chart"]):::ext
            UC_ViewIdeas(["Duyệt bảng tin ý tưởng theo Symbol"]):::main
            UC_LikeBoostIdea(["Thả tim / Boost / Bookmark ý tưởng"]):::ext
            UC_CommentIdea(["Thảo luận & Bình luận ý tưởng"]):::ext
        end

        subgraph Mod_Posts ["2. Bảng Tin Xã Hội (Social Posts)"]
            direction TB
            UC_CreatePost(["Đăng bài viết trạng thái"])
            UC_AttachMedia(["Đính kèm hình ảnh / Video"]):::ext
            UC_ViewFeed(["Xem bảng tin xã hội"]):::main
            UC_ReactPost(["Thả cảm xúc (Like, Love, Haha,...)"]):::ext
            UC_CommentPost(["Bình luận & Trả lời phân cấp"]):::ext
        end

        subgraph Mod_Connections ["3. Bạn Bè & Hội Nhóm (Groups)"]
            direction TB
            UC_FollowTrader(["Theo dõi (Follow) nhà đầu tư"])
            UC_SendFriend(["Gửi lời mời kết bạn"])
            UC_AcceptFriend(["Chấp nhận / Từ chối kết bạn"]):::ext
            UC_CreateGroup(["Tạo nhóm cộng đồng"])
            UC_JoinGroup(["Yêu cầu tham gia nhóm"])
            UC_ApproveMember(["Phê duyệt thành viên vào nhóm"]):::ext
        end

        subgraph Mod_Notifications ["4. Thông Báo (Notifications)"]
            direction TB
            UC_GetNotifications(["Xem danh sách thông báo realtime"]):::main
            UC_MarkRead(["Đánh dấu thông báo đã đọc"]):::ext
        end
    end

    %% Trader Connections
    Trader --> UC_CreateIdea
    Trader --> UC_ViewIdeas
    Trader --> UC_CreatePost
    Trader --> UC_ViewFeed
    Trader --> UC_FollowTrader
    Trader --> UC_SendFriend
    Trader --> UC_CreateGroup
    Trader --> UC_JoinGroup
    Trader --> UC_GetNotifications

    %% Group Admin Connections
    GroupAdmin --> UC_ApproveMember

    %% Extend Relationships - Trading Ideas
    UC_AttachBacktest -.->|"«extend»"| UC_CreateIdea
    UC_LikeBoostIdea -.->|"«extend»"| UC_ViewIdeas
    UC_CommentIdea -.->|"«extend»"| UC_ViewIdeas

    %% Extend Relationships - Social Posts
    UC_AttachMedia -.->|"«extend»"| UC_CreatePost
    UC_ReactPost -.->|"«extend»"| UC_ViewFeed
    UC_CommentPost -.->|"«extend»"| UC_ViewFeed

    %% Extend Relationships - Friends & Groups
    UC_AcceptFriend -.->|"«extend»"| UC_SendFriend
    UC_ApproveMember -.->|"«extend»"| UC_JoinGroup

    %% Extend Relationships - Notifications
    UC_MarkRead -.->|"«extend»"| UC_GetNotifications

    classDef main fill:#f0fdf4,stroke:#16a34a,stroke-width:1.5px;
    classDef inc fill:#e0f2fe,stroke:#0284c7,stroke-dasharray: 4 4;
    classDef ext fill:#fef3c7,stroke:#d97706,stroke-dasharray: 4 4;
```

---

## 3. SƠ ĐỒ LỚP (CLASS DIAGRAMS)

### 3.1 Sơ Đồ Lớp Phân Hệ Backtest Engine (Domain Entities, Models & Engine Services)

Sơ đồ lớp chi tiết thể hiện toàn bộ các lớp nghiệp vụ, mô hình dữ liệu quan hệ, quan hệ thừa kế, hiện thực hóa Interface và phụ thuộc trong `backtest-service`:

```mermaid
classDiagram
    %% Core Entities & Domain Models
    class BacktestRun {
        -Long id
        -Long userId
        -StrategyType strategyType
        -String strategyParams
        -String symbol
        -String timeframe
        -Instant startTime
        -Instant endTime
        -BacktestStatus status
        -Long executionDurationMs
        -Instant createdAt
        +getId() Long
        +getStatus() BacktestStatus
        +setStatus(BacktestStatus) void
    }

    class MetricsSnapshot {
        -Long id
        -BacktestRun backtestRun
        -BigDecimal initialCapital
        -BigDecimal finalBalance
        -BigDecimal totalReturnPercent
        -Integer totalTrades
        -Integer winningTrades
        -Integer losingTrades
        -BigDecimal winRate
        -BigDecimal profitFactor
        -BigDecimal averageWin
        -BigDecimal averageLoss
        -BigDecimal bestTrade
        -BigDecimal worstTrade
        -Integer maxConsecutiveWins
        -Integer maxConsecutiveLosses
        -BigDecimal expectancy
        -BigDecimal rewardRiskRatio
        -BigDecimal maxDrawdown
        -BigDecimal recoveryFactor
        -BigDecimal sharpeRatio
        -BigDecimal sortinoRatio
        -BigDecimal calmarRatio
        -BigDecimal cagr
        -Instant createdAt
    }

    class TradeRecord {
        -Long id
        -BacktestRun backtestRun
        -Integer tradeNumber
        -TradeSide side
        -Instant entryTime
        -Instant exitTime
        -BigDecimal entryPrice
        -BigDecimal exitPrice
        -BigDecimal quantity
        -BigDecimal grossProfit
        -BigDecimal commission
        -BigDecimal slippageCost
        -BigDecimal netProfit
        -BigDecimal returnPercent
        -Integer holdingPeriodBars
        -BigDecimal maxFavorableExcursion
        -BigDecimal maxAdverseExcursion
        -BigDecimal cumulativePnl
        -BigDecimal sizeUsd
        -String entrySignal
        -String exitSignal
    }

    class EquityPointEntity {
        -Long id
        -BacktestRun backtestRun
        -Instant timestamp
        -BigDecimal equity
        -BigDecimal cash
        -BigDecimal openPositionPnl
        -Integer tradeNumber
        -Instant createdAt
    }

    class BacktestStatus {
        <<enumeration>>
        PENDING
        RUNNING
        COMPLETED
        FAILED
    }

    class TradeSide {
        <<enumeration>>
        BUY
        SELL
    }

    class StrategyType {
        <<enumeration>>
        SMA_CROSS
        RSI
        MACD
    }

    %% Strategy Pattern & Factories
    class TradingStrategyFactory {
        <<interface>>
        +getStrategyType() StrategyType
        +getRequiredWarmupBars(StrategyParameters) int
        +build(BarSeries, StrategyParameters) Strategy
    }

    class SmaCrossStrategyFactory {
        +getStrategyType() StrategyType
        +getRequiredWarmupBars(StrategyParameters) int
        +build(BarSeries, StrategyParameters) Strategy
    }

    class RsiStrategyFactory {
        +getStrategyType() StrategyType
        +getRequiredWarmupBars(StrategyParameters) int
        +build(BarSeries, StrategyParameters) Strategy
    }

    class MacdStrategyFactory {
        +getStrategyType() StrategyType
        +getRequiredWarmupBars(StrategyParameters) int
        +build(BarSeries, StrategyParameters) Strategy
    }

    class StrategyFactoryRegistry {
        -Map~StrategyType, TradingStrategyFactory~ factoryMap
        +register(TradingStrategyFactory) void
        +getFactory(StrategyType) TradingStrategyFactory
    }

    %% Core Calculation Services
    class BacktestService {
        -MarketDataService marketDataService
        -StrategyFactoryRegistry strategyFactoryRegistry
        -BacktestEngine backtestEngine
        -BacktestTradingRecordMapper tradingRecordMapper
        +execute(BacktestCommand) BacktestResult
    }

    class ExecutionSimulationService {
        -MarketDataService marketDataService
        -StrategyFactoryRegistry strategyFactoryRegistry
        -BacktestEngine backtestEngine
        -ExecutionService executionService
        -PortfolioService portfolioService
        -MetricsService metricsService
        -FullSimulationResponseMapper fullResponseMapper
        +execute(ExecutionSimulationCommand) List~ExecutedTrade~
        +simulate(PortfolioSimulationRequest) PortfolioSimulationResponse
        +fullSimulation(PortfolioSimulationRequest) FullSimulationResponse
    }

    class MarketDataService {
        -BinanceRestClient binanceClient
        -KlineCache klineCache
        +load(MarketDataRequest, int warmupBars) BarSeries
    }

    class BacktestEngine {
        +run(BarSeries, Strategy) TradingRecord
    }

    class ExecutionService {
        +execute(TradingRecord, BarSeries, ExecutionConfig, BigDecimal capital, Instant startTime) List~ExecutedTrade~
    }

    class PortfolioService {
        +calculate(List~ExecutedTrade~, BarSeries, PortfolioConfig, int warmupBars) PortfolioResult
    }

    class MetricsService {
        +calculate(List~ExecutedTrade~, PortfolioResult) MetricsResult
    }

    %% Relationships
    BacktestRun "1" *-- "1" MetricsSnapshot : has
    BacktestRun "1" *-- "0..*" TradeRecord : contains
    BacktestRun "1" *-- "0..*" EquityPointEntity : tracks
    BacktestRun --> BacktestStatus : has state
    BacktestRun --> StrategyType : configured with
    TradeRecord --> TradeSide : direction

    TradingStrategyFactory <|.. SmaCrossStrategyFactory : implements
    TradingStrategyFactory <|.. RsiStrategyFactory : implements
    TradingStrategyFactory <|.. MacdStrategyFactory : implements

    StrategyFactoryRegistry o-- TradingStrategyFactory : registers

    ExecutionSimulationService --> MarketDataService : calls
    ExecutionSimulationService --> StrategyFactoryRegistry : looks up factory
    ExecutionSimulationService --> BacktestEngine : runs ta4j
    ExecutionSimulationService --> ExecutionService : simulates fills
    ExecutionSimulationService --> PortfolioService : evaluates equity
    ExecutionSimulationService --> MetricsService : calculates metrics
    BacktestService --> ExecutionSimulationService : delegates
```

---

### 3.2 Sơ Đồ Lớp Phân Hệ Mạng Xã Hội Đầu Tư (Community Entities & Domain Model)

```mermaid
classDiagram
    %% Community Entities
    class UserProfile {
        -Long userId
        -String username
        -String displayName
        -String avatarUrl
        -String bio
        -String badge
        -Integer reputation
        -Integer followersCount
        -Integer followingCount
        -Integer ideasCount
        -Boolean isOnline
        -Instant createdAt
        -Instant updatedAt
    }

    class TradingIdea {
        -Long id
        -String title
        -String symbol
        -String assetClass
        -String timeframe
        -String direction
        -BigDecimal entryPrice
        -BigDecimal targetPrice
        -BigDecimal stopLossPrice
        -String coverImage
        -String videoDuration
        -String summary
        -String content
        -Long userId
        -String authorName
        -String authorUsername
        -String authorAvatar
        -String authorBadge
        -Integer authorReputation
        -Integer likesCount
        -Integer commentsCount
        -Integer boostsCount
        -Integer viewsCount
        -String tags
        -Boolean isEditorsPick
        -Instant createdAt
        -Instant updatedAt
    }

    class IdeaComment {
        -Long id
        -Long ideaId
        -Long userId
        -String authorName
        -String authorUsername
        -String authorAvatar
        -String authorBadge
        -String content
        -Integer likesCount
        -Instant createdAt
    }

    class IdeaLike {
        -Long id
        -Long ideaId
        -Long userId
        -Instant createdAt
    }

    class IdeaBoost {
        -Long id
        -Long ideaId
        -Long userId
        -Instant createdAt
    }

    class IdeaBookmark {
        -Long id
        -Long ideaId
        -Long userId
        -Instant createdAt
    }

    class Post {
        -Long id
        -Long userId
        -String authorName
        -String authorUsername
        -String authorAvatar
        -String content
        -String media
        -String privacy
        -Long groupId
        -Integer likesCount
        -Integer loveCount
        -Integer hahaCount
        -Integer wowCount
        -Integer sadCount
        -Integer angryCount
        -Integer commentCount
        -Integer shareCount
        -Instant createdAt
        -Instant updatedAt
    }

    class PostReaction {
        -Long id
        -Long postId
        -Long userId
        -String reactionType
        -Instant createdAt
    }

    class PostComment {
        -Long id
        -Long postId
        -Long parentId
        -Long userId
        -String authorName
        -String authorUsername
        -String authorAvatar
        -String content
        -Integer likesCount
        -Integer replyCount
        -Instant createdAt
    }

    class CommunityGroup {
        -Long id
        -String name
        -String description
        -String coverUrl
        -String privacy
        -Long createdByUserId
        -Integer memberCount
        -Instant createdAt
        -Instant updatedAt
    }

    class GroupMember {
        -Long id
        -Long groupId
        -Long userId
        -String role
        -String status
        -Instant joinedAt
    }

    class Friendship {
        -Long id
        -Long senderId
        -Long receiverId
        -String status
        -Instant createdAt
        -Instant updatedAt
    }

    class Follow {
        -Long id
        -Long followerId
        -Long followingId
        -Instant createdAt
    }

    class Notification {
        -Long id
        -Long recipientId
        -Long actorId
        -String actorName
        -String actorAvatar
        -String type
        -Long referenceId
        -String referenceType
        -String message
        -Boolean isRead
        -Instant createdAt
    }

    %% Entity Relationships
    UserProfile "1" -- "0..*" TradingIdea : authors
    UserProfile "1" -- "0..*" Post : publishes
    TradingIdea "1" *-- "0..*" IdeaComment : has
    TradingIdea "1" *-- "0..*" IdeaLike : receives
    TradingIdea "1" *-- "0..*" IdeaBoost : boosted by
    TradingIdea "1" *-- "0..*" IdeaBookmark : bookmarked by
    Post "1" *-- "0..*" PostReaction : receives
    Post "1" *-- "0..*" PostComment : has
    PostComment "1" o-- "0..*" PostComment : parent-replies
    CommunityGroup "1" *-- "1..*" GroupMember : contains
    CommunityGroup "1" -- "0..*" Post : hosts
    UserProfile "1" -- "0..*" Follow : follows / followed
    UserProfile "1" -- "0..*" Friendship : sender / receiver
    UserProfile "1" -- "0..*" Notification : receives
```

---

### 3.3 Sơ Đồ Lớp Phân Hệ Xác Thực & Dữ Liệu Thị Trường (Auth & Realtime Service)

```mermaid
classDiagram
    %% Auth Service Classes
    class AppUser {
        -Long id
        -String username
        -String email
        -String passwordHash
        -Role role
        -Boolean enabled
        -Instant createdAt
        -Instant updatedAt
        +getId() Long
        +getUsername() String
        +getPasswordHash() String
        +getRole() Role
    }

    class Role {
        <<enumeration>>
        USER
        ADMIN
    }

    class AuthController {
        -AuthService authService
        -JwtTokenProvider jwtTokenProvider
        +register(RegisterRequest) ResponseEntity~AuthResponse~
        +login(LoginRequest) ResponseEntity~AuthResponse~
        +getCurrentUser(UserPrincipal) ResponseEntity~UserProfileResponse~
    }

    class AuthService {
        -UserRepository userRepository
        -PasswordEncoder passwordEncoder
        -JwtTokenProvider tokenProvider
        +registerUser(RegisterDto) AppUser
        +authenticate(LoginDto) String
        +loadUserById(Long) AppUser
    }

    class JwtTokenProvider {
        -String jwtSecret
        -long jwtExpirationInMs
        +generateToken(Authentication) String
        +getUserIdFromJWT(String) Long
        +validateToken(String) boolean
    }

    %% Realtime Service Classes
    class SymbolInfo {
        -String symbol
        -String baseAsset
        -String quoteAsset
        -String status
        -BigDecimal pricePrecision
    }

    class MarketTicker {
        -String symbol
        -BigDecimal lastPrice
        -BigDecimal priceChange
        -BigDecimal priceChangePercent
        -BigDecimal highPrice
        -BigDecimal lowPrice
        -BigDecimal volume
    }

    class Kline {
        -Long openTime
        -BigDecimal open
        -BigDecimal high
        -BigDecimal low
        -BigDecimal close
        -BigDecimal volume
        -Long closeTime
        -Boolean isClosed
    }

    class ChartSubscription {
        -String sessionId
        -String symbol
        -String interval
        -Instant subscribedAt
    }

    class ChartWebSocketController {
        -MarketRealtimeService marketRealtimeService
        -SimpMessagingTemplate messagingTemplate
        +handleSubscribe(SubscriptionMessage) void
        +handleUnsubscribe(SubscriptionMessage) void
    }

    class BinanceWebSocketClient {
        -WebSocketClient client
        -MarketRealtimeService marketRealtimeService
        +connectKlineStream(String symbol, String interval) void
        +disconnectStream(String streamName) void
        +onMessage(String message) void
    }

    %% Relationships
    AppUser --> Role : has role
    AuthController --> AuthService : invokes
    AuthService --> JwtTokenProvider : uses
    ChartWebSocketController --> ChartSubscription : manages
    BinanceWebSocketClient ..> Kline : parses stream into
```

---

## 4. SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAMS)

### 4.1 Luồng Xác Thực Đăng Nhập & Điều Hướng JWT qua API Gateway

Sơ đồ mô tả quy trình đăng nhập, mã hóa, phát hành JWT token và sử dụng Token để truy cập các dịch vụ bảo vệ:

```mermaid
sequenceDiagram
    autonumber
    actor Trader as "👤 Nhà Đầu Tư (Client App)"
    participant GW as "🌐 API Gateway (Port 8080)"
    participant Auth as "🔐 Auth Service (Port 8081)"
    participant DB as "🗄️ MySQL Database"
    participant BT as "📈 Backtest Service (Port 8083)"

    %% Login Flow
    Note over Trader, DB: Giai đoạn 1: Đăng nhập & Lấy Bearer JWT Token
    Trader->>GW: POST /api/auth/login {username, password}
    GW->>Auth: Forward POST /api/auth/login
    Auth->>DB: SELECT * FROM users WHERE username = ?
    DB-->>Auth: AppUser record (password_hash)
    Auth->>Auth: BCrypt.checkpw(rawPassword, password_hash)
    alt Mật khẩu không chính xác
        Auth-->>GW: 401 Unauthorized (Bad credentials)
        GW-->>Trader: 401 Unauthorized
    else Xác thực thành công
        Auth->>Auth: JwtTokenProvider.generateToken(userId, role)
        Auth-->>GW: 200 OK {accessToken: "eyJhbGciOi...", tokenType: "Bearer"}
        GW-->>Trader: 200 OK + JWT Token
        Note over Trader: Client lưu trữ Token vào LocalStorage / Redux Store
    end

    %% Protected Access Flow
    Note over Trader, BT: Giai đoạn 2: Sử dụng Bearer Token gọi Microservice được bảo vệ
    Trader->>GW: GET /api/backtest-runs (Header: Authorization: Bearer eyJhb...)
    GW->>GW: Route Match & Forward Header
    GW->>BT: Forward GET /api/backtest-runs
    BT->>BT: JwtAuthenticationFilter.doFilterInternal()
    BT->>BT: Validate Signature & Extract Claims (userId=1, role="USER")
    BT->>DB: SELECT * FROM backtest_runs WHERE user_id = 1
    DB-->>BT: List of BacktestRun entities
    BT-->>GW: 200 OK [BacktestRunSummaryResponse]
    GW-->>Trader: 200 OK [BacktestRunSummaryResponse]
```

---

### 4.2 Luồng Đăng Ký Nhận Stream Nến Thời Gian Thực qua WebSocket STOMP

```mermaid
sequenceDiagram
    autonumber
    actor Trader as "👤 Nhà Đầu Tư (Chart UI)"
    participant GW as "🌐 API Gateway (WS Route)"
    participant RT as "📊 Realtime Service (Port 8082)"
    participant Binance as "☁️ Binance WebSocket Server"

    %% WebSocket Handshake
    Note over Trader, RT: 1. Nâng cấp giao thức HTTP sang WebSocket STOMP
    Trader->>GW: CONNECT /ws/market (STOMP Handshake)
    GW->>RT: Forward Upgrade: websocket
    RT-->>GW: 101 Switching Protocols
    GW-->>Trader: CONNECTED (STOMP Session established)

    %% Subscription
    Note over Trader, Binance: 2. Subscribe kênh nến của cặp tiền cụ thể
    Trader->>GW: SUBSCRIBE /topic/chart/BTCUSDT/1m
    GW->>RT: Route SUBSCRIBE message
    RT->>RT: Register ChartSubscription (sessionId, "BTCUSDT", "1m")
    
    opt Nếu chưa kết nối Stream Binance cho symbol này
        RT->>Binance: WSS wss://stream.binance.com:9443/ws/btcusdt@kline_1m
        Binance-->>RT: Connection Established
    end

    %% Streaming Loop
    Note over Binance, Trader: 3. Luồng đẩy nến liên tục từ Binance về biểu đồ
    loop Mỗi khi có biến động giá / đóng nến
        Binance->>RT: Push Raw JSON {s: "BTCUSDT", k: {o, h, l, c, v, T, x}}
        RT->>RT: KlineMapper.toDomain(rawJson) -> Kline
        RT->>GW: STOMP MESSAGE /topic/chart/BTCUSDT/1m (Kline DTO)
        GW->>Trader: STOMP MESSAGE (Kline DTO)
        Trader->>Trader: TradingView Chart.update(candle)
    end
```

---

### 4.3 Luồng Thực Thi Kiểm Thử Chiến Lược Toàn Diện (Full Simulation Pipeline)

Đây là chuỗi xử lý quan trọng và phức tạp nhất của hệ thống, thể hiện sự kết hợp giữa phân tích kỹ thuật, mô phỏng khớp lệnh thực tế và thống kê tài chính:

```mermaid
sequenceDiagram
    autonumber
    actor Trader as "👤 Nhà Đầu Tư"
    participant GW as "🌐 API Gateway"
    participant Controller as "🎮 BacktestRunController"
    participant RunService as "⚙️ RunBacktestService"
    participant SimService as "🔬 ExecutionSimulationService"
    participant MarketData as "📉 MarketDataService"
    participant Binance as "☁️ Binance REST API"
    participant Factory as "🏭 StrategyFactoryRegistry"
    participant Engine as "🏎️ BacktestEngine (ta4j)"
    participant ExecService as "💰 ExecutionService"
    participant PortService as "📊 PortfolioService"
    participant MetricService as "📐 MetricsService"
    participant DB as "🗄️ MySQL Database"

    Trader->>GW: POST /api/backtest-runs (RunBacktestRequest)
    GW->>Controller: Forward Request with Bearer Token
    Controller->>RunService: runAndSave(userId, command)

    %% 1. Tải nến kèm Warmup
    RunService->>SimService: fullSimulation(request)
    SimService->>Factory: getFactory(strategyType).getRequiredWarmupBars(params)
    Factory-->>SimService: warmupBars (ví dụ: 200 bars)
    SimService->>MarketData: load(marketDataRequest, warmupBars)
    MarketData->>Binance: GET /api/v3/klines (symbol, interval, startTime, endTime, limit)
    Binance-->>MarketData: JSON array of 500+ klines
    MarketData->>MarketData: Convert to ta4j BarSeries
    MarketData-->>SimService: BarSeries

    %% 2. Tạo chiến lược & Chạy Engine
    SimService->>Factory: build(series, strategyParameters)
    Factory-->>SimService: Strategy (Rule Entry & Exit)
    SimService->>Engine: run(series, strategy)
    Engine-->>SimService: TradingRecord (raw entry/exit orders)

    %% 3. Mô phỏng chi phí & Khớp lệnh
    SimService->>ExecService: execute(tradingRecord, series, executionConfig, capital)
    ExecService->>ExecService: Apply Slippage Cost (trượt giá) & Commission Fee (phí sàn)
    ExecService-->>SimService: List<ExecutedTrade>

    %% 4. Tính toán Equity Curve & Portfolio
    SimService->>PortService: calculate(executedTrades, series, portfolioConfig, warmupBars)
    PortService->>PortService: Compute candle-aware equity, cash, unrealized PnL
    PortService-->>SimService: PortfolioResult (List<EquityPoint>)

    %% 5. Tính toán 22 chỉ số tài chính
    SimService->>MetricService: calculate(executedTrades, portfolioResult)
    MetricService->>MetricService: Sharpe, Sortino, Calmar, Max Drawdown, Win Rate, Expectancy,...
    MetricService-->>SimService: MetricsResult
    SimService-->>RunService: FullSimulationResponse

    %% 6. Lưu trữ CSDL
    RunService->>DB: INSERT INTO backtest_runs (user_id, symbol, status='COMPLETED', ...)
    DB-->>RunService: backtest_run_id = 101
    RunService->>DB: INSERT INTO metrics_snapshots (backtest_run_id, sharpe_ratio, max_drawdown, ...)
    RunService->>DB: INSERT INTO trade_records (backtest_run_id, trade_number, entry_price, ...)
    RunService->>DB: INSERT INTO equity_points (backtest_run_id, timestamp, equity, ...)
    DB-->>RunService: Transaction Committed OK

    RunService-->>Controller: BacktestRunDetailResponse
    Controller-->>GW: 201 Created (Full Backtest Report)
    GW-->>Trader: 201 Created (Render Trades, Charts, Metrics)
```

---

### 4.4 Luồng Đăng Ý Tưởng Giao Dịch & Phát Sinh Thông Báo Tương Tác

```mermaid
sequenceDiagram
    autonumber
    actor TraderA as "👤 Trader A (Tác Giả)"
    actor TraderB as "👤 Trader B (Người Theo Dõi)"
    participant GW as "🌐 API Gateway"
    participant Community as "💬 Community Service (Port 8084)"
    participant DB as "🗄️ MySQL Database"

    %% Đăng ý tưởng
    Note over TraderA, DB: 1. Đăng Ý Tưởng Giao Dịch
    TraderA->>GW: POST /api/community/ideas (CreateIdeaRequest)
    GW->>Community: Forward POST /api/community/ideas (userId=10)
    Community->>DB: INSERT INTO community_trading_ideas (user_id, title, symbol, entry, sl, tp, content)
    DB-->>Community: idea_id = 55
    Community->>DB: UPDATE community_user_profiles SET ideas_count = ideas_count + 1 WHERE user_id = 10
    Community-->>GW: 201 Created (TradingIdea DTO)
    GW-->>TraderA: 201 Created

    %% Tương tác Like & Comment
    Note over TraderB, DB: 2. Trader B Thả Tim & Bình Luận
    TraderB->>GW: POST /api/community/ideas/55/like (Header: userId=20)
    GW->>Community: Forward Like Request
    Community->>DB: INSERT INTO community_idea_likes (idea_id=55, user_id=20)
    Community->>DB: UPDATE community_trading_ideas SET likes_count = likes_count + 1 WHERE id = 55
    
    %% Tạo thông báo cho Trader A
    Community->>DB: INSERT INTO community_notifications (recipient_id=10, actor_id=20, type='IDEA_LIKE', ref_id=55, message='Trader B liked your idea')
    Community-->>GW: 200 OK {liked: true, likesCount: 1}
    GW-->>TraderB: 200 OK

    %% Trader A nhận thông báo
    Note over TraderA, DB: 3. Trader A Kiểm Tra Thông Báo
    TraderA->>GW: GET /api/community/notifications
    GW->>Community: Forward GET (userId=10)
    Community->>DB: SELECT * FROM community_notifications WHERE recipient_id = 10 ORDER BY created_at DESC
    DB-->>Community: List of notifications
    Community-->>GW: 200 OK [NotificationDTO]
    GW-->>TraderA: 200 OK (Hiển thị badge thông báo mới)
```

---

## 5. SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAMS)

### 5.1 Lưu Đồ Thuật Toán Động Cơ Kiểm Thử Chiến Lược Từng Nến (Candle-by-Candle Simulation)

```mermaid
flowchart TD
    Start([Bắt đầu Phiên Kiểm Thử]) --> InputData[Tiếp nhận Cấu hình: Symbol, Timeframe, DateRange, StrategyParams, ExecutionConfig]
    InputData --> CalcWarmup[Tính số nến Warmup cần thiết cho Indicator]
    CalcWarmup --> FetchData[Tải Dữ liệu Lịch sử Nến từ Binance REST API]
    
    FetchData --> CheckData{Có dữ liệu nến hợp lệ?}
    CheckData -- Không --> ThrowErr[Ném ngoại lệ: BacktestException - No market data] --> EndFail([Kết thúc: Thất bại])
    
    CheckData -- Có --> BuildSeries[Khởi tạo đối tượng BarSeries]
    BuildSeries --> BuildRules[Khởi tạo Trading Strategy: EntryRule & ExitRule]
    BuildRules --> RunEngine[Động cơ ta4j duyệt qua từng nến từ WarmupBar đến EndBar]
    
    subgraph CandleLoop ["Vòng Lặp Duyệt Từng Nến (Candle-by-Candle Loop)"]
        direction TB
        EvaluateBar[Đọc nến hiện tại: Open, High, Low, Close, Volume] --> CheckOpenPos{Đang có vị thế mở?}
        
        CheckOpenPos -- Có --> CheckExitCond{Thỏa ExitRule hoặc Hit StopLoss / TakeProfit?}
        CheckExitCond -- Thỏa mãn --> GenExitSignal[Phát sinh tín hiệu EXIT]
        CheckExitCond -- Không --> CheckUpdatePnL[Cập nhật Unrealized PnL theo giá Close]
        
        CheckOpenPos -- Không --> CheckEntryCond{Thỏa EntryRule?}
        CheckEntryCond -- Thỏa mãn --> GenEntrySignal[Phát sinh tín hiệu ENTRY]
        CheckEntryCond -- Không --> SkipBar[Chuyển sang nến kế tiếp]
    end

    RunEngine --> CandleLoop
    CandleLoop --> ProcessTrades[Ghi nhận chuỗi Lệnh thô: TradingRecord]
    
    ProcessTrades --> SimulateExec[Mô phỏng khớp lệnh thực tế: Trừ Trượt giá Slippage & Phí Commission]
    SimulateExec --> CalcEquityPoints[Tính toán chuỗi điểm vốn Equity, Tiền mặt Cash, Max Drawdown từng nến]
    CalcEquityPoints --> CalcMetrics[Tính toán 22 chỉ số tài chính: Sharpe, Sortino, Calmar, WinRate, ProfitFactor, Expectancy]
    
    CalcMetrics --> SaveDB{Lưu kết quả vào CSDL?}
    SaveDB -- Có --> WriteSQL[Lưu vào bảng: backtest_runs, metrics_snapshots, trade_records, equity_points]
    SaveDB -- Không --> ReturnResponse
    WriteSQL --> ReturnResponse[Đóng gói FullSimulationResponse trả về Client]
    ReturnResponse --> EndSuccess([Kết thúc: Thành công])
```

---

### 5.2 Quy Trình Gia Nhập & Phê Duyệt Thành Viên Nhóm Cộng Đồng

```mermaid
flowchart TD
    Start([Người dùng bấm Tham gia Nhóm]) --> CheckGroup{Kiểm tra Quyền riêng tư của Nhóm}
    
    CheckGroup -- Nhóm Công Khai (Public) --> AutoApprove[Tự động phê duyệt: Status = APPROVED]
    AutoApprove --> AddMember[Thêm vào community_group_members: Role = MEMBER]
    AddMember --> IncCount[Cập nhật member_count = member_count + 1]
    IncCount --> NotifyOwner[Gửi thông báo đến Trưởng nhóm: Có thành viên mới gia nhập]
    NotifyOwner --> Success([Gia nhập thành công - Cho phép đăng bài])

    CheckGroup -- Nhóm Riêng Tư (Private) --> CreatePending[Tạo bản ghi: Status = PENDING]
    CreatePending --> SendRequestNotify[Gửi thông báo xét duyệt đến Trưởng nhóm / Quản trị viên]
    SendRequestNotify --> AdminReview{Trưởng nhóm xét duyệt}
    
    AdminReview -- Từ chối (Reject) --> UpdateRejected[Cập nhật Status = REJECTED]
    UpdateRejected --> NotifyUserReject[Thông báo người dùng: Yêu cầu bị từ chối]
    NotifyUserReject --> EndFail([Kết thúc: Không được vào nhóm])

    AdminReview -- Chấp thuận (Approve) --> UpdateApproved[Cập nhật Status = APPROVED]
    UpdateApproved --> IncCount
```

---

## 6. SƠ ĐỒ TRẠNG THÁI (STATE MACHINE DIAGRAMS)

### 6.1 Vòng Đời Phiên Chạy Backtest (`BacktestRun`)

```mermaid
stateDiagram-v2
    [*] --> PENDING : Client gửi yêu cầu chạy kiểm thử
    
    state PENDING {
        [*] --> ValidatingParams : Kiểm tra tham số đầu vào
        ValidatingParams --> FetchingKlines : Tải dữ liệu nến Binance
    }

    PENDING --> RUNNING : Dữ liệu nến sẵn sàng, nạp vào Engine
    
    state RUNNING {
        [*] --> CalculatingIndicators : Tính toán chỉ báo kỹ thuật
        CalculatingIndicators --> SimulatingOrders : Duyệt nến & Phát sinh tín hiệu
        SimulatingOrders --> ApplyingExecutionCosts : Áp dụng trượt giá & phí sàn
        ApplyingExecutionCosts --> EvaluatingPortfolio : Tính toán chuỗi vốn Equity Curve
        EvaluatingPortfolio --> ComputingMetrics : Thống kê 22 chỉ số tài chính
    }

    RUNNING --> COMPLETED : Tính toán hoàn tất & Lưu CSDL thành công
    RUNNING --> FAILED : Lỗi kết nối Binance / Lỗi tính toán / Dữ liệu rỗng
    PENDING --> FAILED : Sai tham số / Không tìm thấy Symbol

    COMPLETED --> [*] : Trả báo cáo chi tiết về Client
    FAILED --> [*] : Báo lỗi tương ứng về Client
```

---

### 6.2 Vòng Đời Vị Thế Lệnh Giao Dịch (`TradeRecord`)

```mermaid
stateDiagram-v2
    [*] --> SIGNAL_DETECTED : Chiến lược phát sinh tín hiệu Entry (BUY / SELL)
    
    SIGNAL_DETECTED --> POSITION_OPENED : Khớp lệnh tại nến tiếp theo với giá Open +/- Slippage
    
    state POSITION_OPENED {
        [*] --> TRACKING_PNL : Cập nhật lãi/lỗ thả nổi (Unrealized PnL) từng nến
        TRACKING_PNL --> UPDATING_MAE_MFE : Cập nhật độ lệch thuận lợi / bất lợi cực đại
    }

    POSITION_OPENED --> POSITION_CLOSED : Thỏa mãn một trong các điều kiện thoát
    
    note right of POSITION_CLOSED
        Các lý do đóng vị thế:
        1. Exit Rule tín hiệu đảo chiều
        2. Chạm ngưỡng Cắt lỗ (Stop Loss Hit)
        3. Chạm ngưỡng Chốt lời (Take Profit Hit)
        4. Hết thời gian kiểm thử (End of Data)
    end note

    POSITION_CLOSED --> SETTLED : Khấu trừ phí Commission & Tính Net Profit cuối cùng
    SETTLED --> [*] : Lưu vào danh sách TradeRecord
```

---

### 6.3 Vòng Đời Quan Hệ Bạn Bè & Trạng Thái Thành Viên Nhóm

```mermaid
stateDiagram-v2
    %% Friendship Lifecycle
    state "Quan Hệ Bạn Bè (Friendship)" as FS {
        [*] --> NONE
        NONE --> PENDING_SENT : User A gửi lời mời kết bạn tới User B
        PENDING_SENT --> ACCEPTED : User B bấm Đồng ý
        PENDING_SENT --> REJECTED : User B bấm Từ chối
        ACCEPTED --> UNFRIENDED : Một trong hai người bấm Hủy kết bạn
        PENDING_SENT --> CANCELLED : User A hủy lời mời đã gửi
        UNFRIENDED --> PENDING_SENT : Gửi lại lời mời mới
    }

    %% Group Member Lifecycle
    state "Thành Viên Nhóm (GroupMember)" as GM {
        [*] --> NOT_MEMBER
        NOT_MEMBER --> APPROVED : Tham gia nhóm công khai (Public)
        NOT_MEMBER --> PENDING : Xin vào nhóm riêng tư (Private)
        PENDING --> APPROVED : Quản trị viên duyệt
        PENDING --> REJECTED : Quản trị viên từ chối
        APPROVED --> REMOVED : Bị đuổi khỏi nhóm / Tự rời nhóm
        APPROVED --> PROMOTED_ADMIN : Được chỉ định làm Quản trị viên
    }
```

---

## 7. SƠ ĐỒ THÀNH PHẦN & TRIỂN KHAI (COMPONENT & DEPLOYMENT DIAGRAMS)

### 7.1 Sơ Đồ Thành Phần (Component Diagram)

Sơ đồ thể hiện cấu trúc mô-đun hóa, cổng giao tiếp và các luồng phụ thuộc giữa các thành phần phần mềm trong hệ thống Microservices:

```mermaid
graph TB
    subgraph "CLIENT TIER"
        UI["💻 React Single Page Application\n(TypeScript, Vite, TailwindCSS)"]
        TVChart["📊 TradingView Lightweight Chart Component"]
        WSClient["⚡ STOMP / SockJS WebSocket Client"]
        RestClient["🌐 Axios REST Client"]
        UI --- TVChart
        UI --- WSClient
        UI --- RestClient
    end

    subgraph "GATEWAY TIER"
        Gateway["🚪 Spring Cloud API Gateway (Port 8080)"]
        CorsFilter["🛡️ Global CORS & Security Filter"]
        RoutingTable["🔀 Dynamic Routing Table"]
        Gateway --- CorsFilter
        Gateway --- RoutingTable
    end

    subgraph "BACKEND MICROSERVICES TIER"
        subgraph "auth-service (Port 8081)"
            AuthCtrl["AuthController"]
            AuthSvc["AuthService"]
            JwtComp["JwtTokenProvider"]
            AuthRepo["UserRepository"]
            AuthCtrl --> AuthSvc
            AuthSvc --> JwtComp
            AuthSvc --> AuthRepo
        end

        subgraph "realtime-service (Port 8082)"
            WSCtrl["ChartWebSocketController"]
            RestMarketCtrl["MarketDataController"]
            RTMarketSvc["MarketRealtimeService"]
            BinanceClient["BinanceRestClient & WebSocketClient"]
            WSCtrl --> RTMarketSvc
            RestMarketCtrl --> RTMarketSvc
            RTMarketSvc --> BinanceClient
        end

        subgraph "backtest-service (Port 8083)"
            BacktestCtrl["BacktestRunController"]
            SimSvc["ExecutionSimulationService"]
            EngineComp["BacktestEngine (ta4j Core)"]
            StrategyReg["StrategyFactoryRegistry"]
            ExecEngine["ExecutionService (Slippage/Fees)"]
            PortEngine["PortfolioService (Equity Curve)"]
            MetricEngine["MetricsService (22 Indicators)"]
            BacktestRepo["BacktestRunRepository"]

            BacktestCtrl --> SimSvc
            SimSvc --> StrategyReg
            SimSvc --> EngineComp
            SimSvc --> ExecEngine
            SimSvc --> PortEngine
            SimSvc --> MetricEngine
            BacktestCtrl --> BacktestRepo
        end

        subgraph "community-service (Port 8084)"
            CommCtrl["TradingIdea & Post & Group Controllers"]
            CommSvc["CommunityService & NotificationService"]
            CommRepo["Community Repositories"]
            CommCtrl --> CommSvc
            CommSvc --> CommRepo
        end
    end

    subgraph "DATA STORAGE TIER"
        MySQL[("🗄️ MySQL 8.0 Database\nbacktest_trading_system")]
    end

    subgraph "EXTERNAL CLOUD TIER"
        BinanceCloud["☁️ Binance Public APIs\n(api.binance.com / wss://stream.binance.com)"]
    end

    %% Connectors
    RestClient -->|HTTP/REST| Gateway
    WSClient -->|WebSocket STOMP| Gateway

    Gateway -->|/api/auth/**| AuthCtrl
    Gateway -->|/ws/market/**| WSCtrl
    Gateway -->|/api/market/**| RestMarketCtrl
    Gateway -->|/api/backtest/**| BacktestCtrl
    Gateway -->|/api/community/**| CommCtrl

    AuthRepo -->|JDBC / JPA| MySQL
    BacktestRepo -->|JDBC / JPA| MySQL
    CommRepo -->|JDBC / JPA| MySQL

    BinanceClient -->|HTTPS REST & WSS| BinanceCloud
    SimSvc -->|Load Historical Klines| BinanceCloud
```

---

### 7.2 Sơ Đồ Triển Khai Vật Lý (Deployment Diagram)

Sơ đồ mô tả cách thức hệ thống được phân bổ trên các nút phần cứng, container và các giao thức truyền tải mạng:

```mermaid
graph TD
    subgraph ClientNode ["🖥️ Client Device (PC / Laptop / Mobile)"]
        Browser["🌐 Web Browser (Chrome, Firefox, Edge)\n• React 18 Application\n• TradingView Canvas Rendering\n• Port: 5173 (Dev) / 80 (Prod)"]
    end

    subgraph HostServer ["☁️ Backend Application Server (Linux / Docker Environment)"]
        subgraph GatewayContainer ["Container: api-gateway"]
            GWProcess["Spring Boot 3.x (OpenJDK 17)\n• Port: 8080\n• Inbound HTTP & WebSocket Reverse Proxy"]
        end

        subgraph AuthContainer ["Container: auth-service"]
            AuthProcess["Spring Boot 3.x (OpenJDK 17)\n• Port: 8081\n• Internal REST API"]
        end

        subgraph RealtimeContainer ["Container: realtime-service"]
            RealtimeProcess["Spring Boot 3.x (OpenJDK 17)\n• Port: 8082\n• STOMP WebSocket Broker & Binance Relay"]
        end

        subgraph BacktestContainer ["Container: backtest-service"]
            BacktestProcess["Spring Boot 3.x (OpenJDK 17)\n• Port: 8083\n• High-performance Calculation Engine (ta4j)"]
        end

        subgraph CommunityContainer ["Container: community-service"]
            CommunityProcess["Spring Boot 3.x (OpenJDK 17)\n• Port: 8084\n• Social Graph & Realtime Notifications"]
        end
    end

    subgraph DatabaseServer ["🗄️ Database Server"]
        subgraph MySQLContainer ["Container: mysql-server"]
            MySQLDB["MySQL Server 8.0+\n• Port: 3306\n• Storage Engine: InnoDB (utf8mb4)\n• Database: backtest_trading_system"]
        end
    end

    subgraph ExternalNetwork ["🌐 Binance Global Cloud"]
        BinanceREST["Binance REST API Gateway\nhttps://api.binance.com (Port 443)"]
        BinanceWSS["Binance WebSocket Stream Server\nwss://stream.binance.com:9443 (Port 9443)"]
    end

    %% Network Protocols
    Browser -->|HTTP/HTTPS : 8080\nREST Requests| GWProcess
    Browser -->|WSS / WS : 8080\nSTOMP Protocol| GWProcess

    GWProcess -->|HTTP : 8081| AuthProcess
    GWProcess -->|WS / HTTP : 8082| RealtimeProcess
    GWProcess -->|HTTP : 8083| BacktestProcess
    GWProcess -->|HTTP : 8084| CommunityProcess

    AuthProcess -->|TCP / JDBC : 3306| MySQLDB
    BacktestProcess -->|TCP / JDBC : 3306| MySQLDB
    CommunityProcess -->|TCP / JDBC : 3306| MySQLDB

    RealtimeProcess -->|HTTPS : 443| BinanceREST
    RealtimeProcess -->|WSS : 9443| BinanceWSS
    BacktestProcess -->|HTTPS : 443\nFetch Historical Klines| BinanceREST
```

---

## 8. TỔNG KẾT & KHUYẾN NGHỊ BẢO VỆ KHÓA LUẬN (KLTN)

1. **Tính hoàn chỉnh & đồng bộ**:
   - Mọi thực thể trong Class Diagram đều đối sánh chính xác 1-1 với cấu trúc bảng trong [schema.sql](file:///d:/KLTN/trading-backtest-engine/backend/database/schema.sql) và các model Java thực tế của dự án.
   - Các Sequence Diagram phản ánh chính xác luồng gọi hàm từ Controller $\rightarrow$ Service $\rightarrow$ Engine $\rightarrow$ Mapper $\rightarrow$ Repository.
2. **Điểm nhấn chuyên sâu trong báo cáo**:
   - Nhấn mạnh vào **Phân hệ Backtest Core Engine**: Khả năng phân tách rõ ràng giữa `ta4j Strategy` (tạo tín hiệu lý thuyết) và `ExecutionSimulationService` (mô phỏng chi phí thực tế: trượt giá, phí giao dịch, số dư tài khoản).
   - Mô hình mạng xã hội kết hợp tài chính (`Community Service` liên kết trực tiếp với dữ liệu nến và cấu hình kiểm thử).
3. **Cách trích xuất sơ đồ vào Luận văn / Slide**:
   - Tất cả các sơ đồ trên đều viết bằng mã nguồn **Mermaid**. Bạn có thể sao chép trực tiếp vào các công cụ như [Mermaid Live Editor](https://mermaid.live), Notion, Obsidian hoặc xuất ra định dạng Vector SVG/PNG với độ phân giải cao để chèn vào tài liệu Word / LaTeX của Khóa luận tốt nghiệp.
