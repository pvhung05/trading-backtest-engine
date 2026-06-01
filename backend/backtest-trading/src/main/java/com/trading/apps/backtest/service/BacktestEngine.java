package com.trading.apps.backtest.service;

import org.ta4j.core.BarSeries;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;

/**
 * Runs a trading strategy against a bar series and returns the trading record.
 */
public interface BacktestEngine {

    /**
     * Runs the given strategy on the given series.
     *
     * @param series the market data series
     * @param strategy the trading strategy
     * @return the resulting trading record
     */
    TradingRecord run(BarSeries series, Strategy strategy);
}