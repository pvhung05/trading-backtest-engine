package com.trading.apps.backtest.model;

import java.time.Instant;

import lombok.Builder;
import lombok.Value;

/**
 * Domain model representing a completed trade.
 */
@Value
@Builder
public class Trade {

    Instant entryTime;

    double entryPrice;

    Instant exitTime;

    double exitPrice;

    double profitPercent;
}