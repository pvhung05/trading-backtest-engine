package com.trading.service;

import java.util.List;

import com.trading.model.ExecutedTrade;
import com.trading.model.MetricsResult;
import com.trading.model.PortfolioResult;

/**
 * Public API of the Metrics module.
 * Orchestrates calculation of all performance metrics from executed trades and portfolio result.
 */
public interface MetricsService {

    /**
     * Calculates all performance metrics.
     *
     * @param trades list of executed (closed) trades (may be empty)
     * @param portfolioResult portfolio result with equity curve (must not be null)
     * @return aggregated metrics result
     * @throws IllegalArgumentException if inputs fail validation
     */
    MetricsResult calculate(List<ExecutedTrade> trades, PortfolioResult portfolioResult);
}
