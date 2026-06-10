package com.trading.apps.api.response.execution;

/**
 * JSON DTO for a single executed trade.
 */
public record ExecutedTradeResponse(
        String entryTime,
        String exitTime,
        double entryPrice,
        double exitPrice,
        double quantity,
        double grossProfit,
        double commission,
        double slippageCost,
        double netProfit
) {
}