package com.trading.realtime.api.response;

import lombok.Builder;
import lombok.Data;

/**
 * WebSocket event DTO for real-time ticker updates.
 * Pushed to frontend via /topic/watchlist destination.
 */
@Data
@Builder
public class RealtimeTickerEvent {
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
