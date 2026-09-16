package com.trading.dto.response;

import java.util.List;

import com.trading.dto.response.ExecutedTradeResponse;
import com.trading.dto.response.MetricsSimulationResponse;
import com.trading.dto.response.PortfolioSimulationResponse;

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
