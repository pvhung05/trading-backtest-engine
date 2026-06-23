package com.trading.apps.api.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Detailed response for a single backtest run including trades, metrics, and equity curve.
 */
public record BacktestRunDetailResponse(
        Long id,
        String strategyType,
        String strategyParams,
        String symbol,
        String timeframe,
        Instant startTime,
        Instant endTime,
        String status,
        Instant createdAt,
        Long executionDurationMs,
        MetricsDetail metrics,
        List<TradeDetail> trades,
        List<EquityPointDetail> equityCurve
) {

    public record MetricsDetail(
            BigDecimal initialCapital,
            BigDecimal finalBalance,
            BigDecimal totalReturnPercent,
            int totalTrades,
            int winningTrades,
            int losingTrades,
            BigDecimal winRate,
            BigDecimal profitFactor,
            BigDecimal averageWin,
            BigDecimal averageLoss,
            BigDecimal bestTrade,
            BigDecimal worstTrade,
            int maxConsecutiveWins,
            int maxConsecutiveLosses,
            BigDecimal expectancy,
            BigDecimal rewardRiskRatio,
            BigDecimal maxDrawdown,
            BigDecimal recoveryFactor,
            BigDecimal sharpeRatio,
            BigDecimal sortinoRatio,
            BigDecimal calmarRatio,
            BigDecimal cagr
    ) {
    }

    /**
     * Represents a single row in the trades table.
     * Each trade produces two rows: one Entry row and one Exit row.
     *
     * Fields:
     * - tradeNumberWithSide: "8 Long", "7 Short", etc.
     * - type: "Entry" or "Exit"
     * - dateTime: timestamp of the action
     * - signal: signal name that triggered the action
     * - price: price at the action time
     * - sizeBtc: quantity in BTC
     * - sizeUsd: quantity * price in USD
     * - netPnl: net profit/loss (filled only on Exit rows)
     * - favorableExcursion: MFE in currency (filled only on Exit rows)
     * - adverseExcursion: MAE in currency (filled only on Exit rows)
     * - cumulativePnl: running cumulative PnL (filled only on Exit rows)
     */
    public record TradeDetail(
            String tradeNumberWithSide,  // e.g. "8 Long"
            String type,                // "Entry" or "Exit"
            Instant dateTime,
            String signal,
            BigDecimal price,
            BigDecimal sizeBtc,
            BigDecimal sizeUsd,
            BigDecimal netPnl,
            BigDecimal favorableExcursion,
            BigDecimal adverseExcursion,
            BigDecimal cumulativePnl
    ) {
    }

    public record EquityPointDetail(
            Instant timestamp,
            BigDecimal equity,
            BigDecimal cash,
            BigDecimal openPositionPnl,
            int tradeNumber
    ) {
    }
}
