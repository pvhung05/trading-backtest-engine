package com.trading.dto.response;

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