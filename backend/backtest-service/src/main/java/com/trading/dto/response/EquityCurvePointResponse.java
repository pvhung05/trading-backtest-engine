package com.trading.dto.response;

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
