package com.trading.apps.portfolio.model;

import java.time.Instant;

import lombok.Builder;
import lombok.Getter;

/**
 * A single point in the equity curve.
 */
@Getter
@Builder
public class EquityPoint {

    /** Timestamp of the equity measurement. */
    private final Instant timestamp;

    /** Equity value at that time (cash + mark-to-market position). */
    private final double equity;

    /** Whether there is an open position at this candle. */
    private final boolean openPosition;

    /** Unrealized P&L of the open position at this candle. Zero if not holding. */
    private final double openPositionPnl;
}
