package com.trading.realtime.api.response;

import lombok.Builder;
import lombok.Data;

/**
 * Response DTO for cache overview information.
 * Provides statistics about cached data.
 */
@Data
@Builder
public class CacheOverviewResponse {
	private int symbolCount;
	private int tickerCount;
	private int chartSubscriptionCount;
}
