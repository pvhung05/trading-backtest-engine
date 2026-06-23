package com.trading.apps.strategy.factory;

import com.trading.apps.strategy.model.StrategyParameters;
import com.trading.apps.strategy.enums.StrategyType;
import org.ta4j.core.BarSeries;
import org.ta4j.core.Strategy;

public interface TradingStrategyFactory {

    StrategyType getType();

    int getRequiredWarmupBars(StrategyParameters parameters);

    Strategy build(
            BarSeries series,
            StrategyParameters parameters
    );

    /**
     * Returns a human-readable name for the entry signal of this strategy.
     */
    String getEntrySignalName();

    /**
     * Returns a human-readable name for the exit signal of this strategy.
     */
    String getExitSignalName();
}
