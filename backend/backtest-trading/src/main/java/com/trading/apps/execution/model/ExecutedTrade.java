package com.trading.apps.execution.model;

import java.time.Instant;

import lombok.Builder;
import lombok.Value;

/**
 * Final simulated execution result for a closed trade.
 */
@Value
@Builder
public class ExecutedTrade {

    Instant entryTime;

    Instant exitTime;

    double entryPrice;

    double exitPrice;

    double quantity;

    double grossProfit;

    double commission;

    double slippageCost;

    double netProfit;
}
