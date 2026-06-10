package com.trading.apps.portfolio.model;

import java.time.Instant;

import lombok.Builder;
import lombok.Getter;

/**
 * Represents account state after an executed trade.
 */
@Getter
@Builder
public class PortfolioSnapshot {

    /** Timestamp of the snapshot (trade exit time). */
    private final Instant timestamp;

    /** Total balance after applying the trade. */
    private final double balance;

    /** Cash available after applying the trade. */
    private final double cash;

    /** Profit contributed by the trade (netProfit). */
    private final double tradeProfit;

    /** Sequential trade number (1-based). */
    private final int tradeNumber;
}
