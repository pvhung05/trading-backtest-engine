package com.trading.apps.api.response.execution;

import java.util.List;

/**
 * JSON DTO exposing the executed trade chain produced by the execution pipeline.
 */
public record ExecutionSimulationResponse(
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
        List<ExecutedTradeResponse> trades
) {
}