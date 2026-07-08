package com.trading.realtime.api.response;

import lombok.Builder;
import lombok.Data;

/**
 * WebSocket event DTO for real-time kline/candle updates.
 * Pushed to frontend via /topic/chart/{symbol}/{interval} destination.
 */
@Data
@Builder
public class RealtimeKlineEvent {
	private String symbol;
	private String interval;
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
