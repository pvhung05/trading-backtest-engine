package com.trading.model;

import com.trading.model.MarketDataRequest;
import com.trading.strategy.enums.StrategyType;
import com.trading.strategy.model.StrategyParameters;

import lombok.Builder;
import lombok.Value;

/**
 * Domain command used to execute a backtest.
 */
@Value
@Builder
public class BacktestCommand {

    MarketDataRequest marketDataRequest;

    StrategyType strategyType;

    StrategyParameters strategyParameters;
}