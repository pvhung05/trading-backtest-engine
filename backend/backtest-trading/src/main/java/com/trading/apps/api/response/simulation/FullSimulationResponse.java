package com.trading.apps.api.response.simulation;

import java.util.List;

import com.trading.apps.api.response.execution.ExecutedTradeResponse;
import com.trading.apps.api.response.metrics.MetricsSimulationResponse;
import com.trading.apps.api.response.portfolio.PortfolioSimulationResponse;

/**
 * JSON DTO exposing the complete result of a full simulation pipeline.
 * Combines executed trades, equity curve, and all performance metrics
 * in a single response.
 */
public record FullSimulationResponse(
        ExecutionMetadata metadata,
        List<ExecutedTradeResponse> trades,
        PortfolioSimulationResponse portfolio,
        MetricsSimulationResponse metrics
) {

    /**
     * Metadata about the simulation configuration.
     */
    public record ExecutionMetadata(
            String symbol,
            String timeframe,
            String startTime,
            String endTime,
            String strategyType,
            double capital,
            double commissionRate,
            double slippageRate,
            double positionSizePercent
    ) {
    }
}
