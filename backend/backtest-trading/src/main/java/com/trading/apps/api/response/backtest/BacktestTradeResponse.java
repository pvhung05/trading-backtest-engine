package com.trading.apps.api.response.backtest;

/**
 * JSON DTO for a single completed trade in the backtest result.
 */
public record BacktestTradeResponse(
        String entryTime,
        double entryPrice,
        String exitTime,
        double exitPrice,
        double profitPercent
) {
}