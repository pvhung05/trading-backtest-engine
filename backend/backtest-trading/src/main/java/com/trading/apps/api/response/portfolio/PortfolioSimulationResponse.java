package com.trading.apps.api.response.portfolio;

/**
 * JSON DTO exposing the complete result of a portfolio simulation.
 * Combines equity curve and computed statistics.
 */
public record PortfolioSimulationResponse(
        String symbol,
        String timeframe,
        String startTime,
        String endTime,
        String strategyType,
        double capital,
        double commissionRate,
        double slippageRate,
        double positionSizePercent,
        int tradeCount,
        EquityCurveResponse equityCurve,
        PortfolioStatsResponse stats
) {
}
