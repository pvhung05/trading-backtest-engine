package com.trading.apps.portfolio.service;

import java.util.List;

import org.ta4j.core.BarSeries;

import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.PortfolioConfig;
import com.trading.apps.portfolio.model.PortfolioResult;

/**
 * Portfolio service interface.
 */
public interface PortfolioService {

    /**
     * Calculate portfolio evolution using candle-level mark-to-market.
     * Equity is computed at every candle bar, accounting for open positions.
     *
     * @param trades executed trades (from Execution module)
     * @param series the bar series (candles) for mark-to-market calculation
     * @param config portfolio configuration
     * @param warmupBars number of initial bars to skip (strategy warmup period)
     * @return the portfolio result with candle-by-candle equity curve
     */
    PortfolioResult calculate(List<ExecutedTrade> trades, BarSeries series, PortfolioConfig config, int warmupBars);
}
