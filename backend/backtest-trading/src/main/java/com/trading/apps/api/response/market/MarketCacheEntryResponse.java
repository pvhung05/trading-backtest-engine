package com.trading.apps.api.response.market;

/**
 * JSON DTO for one cached market-data entry.
 */
public record MarketCacheEntryResponse(
        String cacheKey,
        String symbol,
        String timeframe,
        String startTime,
        String endTime,
        int barCount
) {
}
