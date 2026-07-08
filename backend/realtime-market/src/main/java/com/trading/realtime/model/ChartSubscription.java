package com.trading.realtime.model;

import lombok.Builder;
import lombok.Data;

/**
 * Represents a chart subscription for a specific symbol and interval.
 * Tracks subscriber count (multiple frontend clients sharing one WS connection),
 * the latest candle data, and last access timestamp for auto-cleanup decisions.
 */
@Data
@Builder
public class ChartSubscription {
	private String symbol;
	private String interval;
	private Kline latestCandle;
	private int subscriberCount;
	private long lastAccessTime;
	private String wsSessionId;
}
