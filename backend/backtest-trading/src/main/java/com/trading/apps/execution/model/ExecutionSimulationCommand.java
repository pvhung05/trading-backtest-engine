package com.trading.apps.execution.model;

import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.strategy.model.StrategyParameters;

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