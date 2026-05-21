package com.trading.apps.market.model;

import java.time.Instant;

/**
 * Snapshot view of a cached market-data series.
 */
public record MarketDataCacheSnapshot(
        String cacheKey,
        String symbol,
        String timeframe,
        Instant startTime,
        Instant endTime,
        int barCount
) {
}
