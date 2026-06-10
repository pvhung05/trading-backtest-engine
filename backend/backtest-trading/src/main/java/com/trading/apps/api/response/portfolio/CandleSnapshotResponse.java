package com.trading.apps.api.response.portfolio;

/**
 * A single account snapshot after an executed trade.
 */
public record CandleSnapshotResponse(
        String timestamp,
        double balance,
        double cash,
        double tradeProfit,
        int tradeNumber
) {
}
