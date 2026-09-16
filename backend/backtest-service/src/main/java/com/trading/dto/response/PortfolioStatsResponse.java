package com.trading.dto.response;

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
