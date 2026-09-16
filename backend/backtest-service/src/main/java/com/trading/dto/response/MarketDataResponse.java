package com.trading.dto.response;

import java.util.List;

/**
 * JSON DTO for market data endpoint.
 */
public record MarketDataResponse(
        String symbol,
        String timeframe,
        String startTime,
        String endTime,
        int barCount,
        List<MarketBarResponse> bars
) {
}