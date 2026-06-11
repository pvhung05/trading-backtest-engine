package com.trading.apps.api.response.portfolio;

/**
 * A single data point in the equity curve.
 */
public record EquityCurvePointResponse(
        String timestamp,
        double equity,
        boolean openPosition,
        double openPositionPnl
) {
}
