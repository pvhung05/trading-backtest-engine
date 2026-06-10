package com.trading.apps.api.response.backtest;

import java.util.List;

/**
 * JSON DTO that exposes the trading-record chain produced by a backtest.
 */
public record BacktestTradingRecordResponse(
        String symbol,
        String timeframe,
        String startTime,
        String endTime,
        String strategyType,
        int tradeCount,
        List<BacktestTradeResponse> trades
) {
}