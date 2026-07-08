package com.trading.realtime.api.response;

import lombok.Builder;
import lombok.Data;

/**
 * Response DTO for 24-hour market ticker data.
 * Exposed via /api/market/watchlist endpoint and WebSocket /topic/watchlist.
 */
@Data
@Builder
public class MarketTickerResponse {
	private String symbol;
	private String lastPrice;
	private String priceChange;
	private String priceChangePercent;
	private String highPrice;
	private String lowPrice;
	private String volume;
	private String quoteVolume;
	private long updateTime;
}
