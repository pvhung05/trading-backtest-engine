package com.trading.realtime.api.response;

import lombok.Builder;
import lombok.Data;

/**
 * Response DTO for a single candlestick/kline data point.
 * Exposed via REST /api/market/klines endpoint and WebSocket /topic/chart/{symbol}/{interval}.
 */
@Data
@Builder
public class KlineResponse {
	private long openTime;
	private String open;
	private String high;
	private String low;
	private String close;
	private String volume;
	private long closeTime;
	private String quoteVolume;
	private int trades;
	private boolean isClosed;
}
