package com.trading.apps.api.response.market;

import java.util.List;

/**
 * JSON DTO for the current market cache state.
 */
public record MarketCacheResponse(
        int cacheSize,
        List<MarketCacheEntryResponse> entries
) {
}
