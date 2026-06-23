package com.trading.apps.api.response;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Summary response for a backtest run.
 */
public record BacktestRunSummaryResponse(
        Long id,
        String strategyType,
        String symbol,
        String timeframe,
        Instant startTime,
        Instant endTime,
        String status,
        Instant createdAt,
        Long executionDurationMs,
        MetricsSummary metrics
) {

    public record MetricsSummary(
            BigDecimal totalReturnPercent,
            int totalTrades,
            BigDecimal winRate,
            BigDecimal maxDrawdown
    ) {
    }
}
