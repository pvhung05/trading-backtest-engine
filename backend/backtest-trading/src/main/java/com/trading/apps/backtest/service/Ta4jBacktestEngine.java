package com.trading.apps.backtest.service;

import java.util.Objects;

import org.springframework.stereotype.Service;
import org.ta4j.core.BarSeries;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;
import org.ta4j.core.backtest.BarSeriesManager;

/**
 * TA4J-backed implementation of {@link BacktestEngine}.
 */
@Service
public class Ta4jBacktestEngine implements BacktestEngine {

    /**
     * Runs the strategy with TA4J's {@link BarSeriesManager}.
     *
     * @param series the market data series
     * @param strategy the trading strategy
     * @return the resulting trading record
     */
    @Override
    public TradingRecord run(BarSeries series, Strategy strategy) {
        Objects.requireNonNull(series, "series cannot be null");
        Objects.requireNonNull(strategy, "strategy cannot be null");

        BarSeriesManager manager = new BarSeriesManager(series);
        return manager.run(strategy);
    }
}