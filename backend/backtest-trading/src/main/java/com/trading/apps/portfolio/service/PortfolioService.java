package com.trading.apps.portfolio.service;

import java.util.List;

import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.PortfolioConfig;
import com.trading.apps.portfolio.model.PortfolioResult;

/**
 * Portfolio service interface.
 */
public interface PortfolioService {

    /**
     * Calculate portfolio evolution from executed trades and configuration.
     *
     * @param trades executed trades (from Execution module)
     * @param config portfolio configuration
     * @return the portfolio result
     */
    PortfolioResult calculate(List<ExecutedTrade> trades, PortfolioConfig config);
}
