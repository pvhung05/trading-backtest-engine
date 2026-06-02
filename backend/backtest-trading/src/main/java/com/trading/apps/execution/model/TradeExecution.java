package com.trading.apps.execution.model;

import java.time.Instant;

import lombok.Builder;
import lombok.Value;

/**
 * Intermediate execution view of a closed TA4J position.
 */
@Value
@Builder
public class TradeExecution {

	Instant entryTime;

	Instant exitTime;

	double entryPrice;

	double exitPrice;
}
