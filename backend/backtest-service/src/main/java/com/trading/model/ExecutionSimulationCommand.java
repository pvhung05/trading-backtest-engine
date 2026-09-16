package com.trading.model;

import com.trading.model.MarketDataRequest;
import com.trading.strategy.enums.StrategyType;
import com.trading.strategy.model.StrategyParameters;

import lombok.Builder;
import lombok.Value;

/**
 * Domain command used to execute and simulate a full trade execution flow.
 */
@Value
@Builder
public class ExecutionSimulationCommand {

    MarketDataRequest marketDataRequest;

    StrategyType strategyType;

    StrategyParameters strategyParameters;

    ExecutionConfig executionConfig;

    double capital;
}