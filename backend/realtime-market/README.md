# realtime-market

Realtime market data gateway microservice between the frontend and Binance.

## Purpose

This service acts as the sole gateway for market data. The frontend must NOT call Binance directly.

## Tech Stack

- Java 21
- Spring Boot 3
- Spring Web
- Spring WebSocket (STOMP)
- Spring Scheduling
- Lombok
- Jackson
- Maven

## Architecture

- REST API: symbols, watchlist, historical klines
- WebSocket: STOMP broker for pushing ticker and chart updates
- Binance REST client: exchange info, 24hr tickers, klines
- Binance WebSocket client: ticker stream, chart streams
- In-memory cache: symbols, watchlist, chart subscriptions
- Scheduler: cleanup inactive chart subscriptions

## Run

```
./mvnw spring-boot:run -pl backend/realtime-market
```

## Port

Default: `8082`
