package com.trading.apps.api.response.portfolio;

/**
 * High-level portfolio statistics derived from the simulation.
 */
public record PortfolioStatsResponse(
        double initialCapital,
        double finalEquity,
        double totalReturn,
        double totalReturnPercent,
        int tradeCount
) {
}
