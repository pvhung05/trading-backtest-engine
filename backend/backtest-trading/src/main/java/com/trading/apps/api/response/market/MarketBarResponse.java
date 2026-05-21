package com.trading.apps.api.response.market;

/**
 * JSON DTO for one market bar.
 */
public record MarketBarResponse(
        String endTime,
        double open,
        double high,
        double low,
        double close,
        double volume
) {
}
