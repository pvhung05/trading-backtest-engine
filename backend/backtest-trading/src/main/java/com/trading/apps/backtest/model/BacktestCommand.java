package com.trading.apps.backtest.model;

import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.strategy.model.StrategyParameters;

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