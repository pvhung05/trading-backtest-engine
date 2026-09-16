package com.trading.model;

import lombok.Builder;
import lombok.Value;

/**
 * Immutable configuration for simulating execution costs and position sizing.
 */
@Value
@Builder
public class ExecutionConfig {

    double commissionRate;

    double slippageRate;

    double positionSizePercent;
}
