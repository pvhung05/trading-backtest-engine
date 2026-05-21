package com.trading.apps.api.mapper.market;

import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.api.response.market.MarketCacheEntryResponse;
import com.trading.apps.api.response.market.MarketCacheResponse;
import com.trading.apps.market.model.MarketDataCacheSnapshot;

/**
 * Maps cache snapshots to API responses.
 */
@Component
public class MarketCacheResponseMapper {

    public MarketCacheResponse toResponse(List<MarketDataCacheSnapshot> snapshots) {
        List<MarketCacheEntryResponse> entries = snapshots.stream()
                .map(snapshot -> new MarketCacheEntryResponse(
                        snapshot.cacheKey(),
                        snapshot.symbol(),
                        snapshot.timeframe(),
                        snapshot.startTime().toString(),
                        snapshot.endTime().toString(),
                        snapshot.barCount()
                ))
                .toList();

        return new MarketCacheResponse(entries.size(), entries);
    }
}