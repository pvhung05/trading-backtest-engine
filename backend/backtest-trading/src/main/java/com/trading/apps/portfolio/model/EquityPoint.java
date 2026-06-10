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

    /** Equity value at that time. */
    private final double equity;
}
