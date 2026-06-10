package com.trading.apps.portfolio.validator;

import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.PortfolioConfig;

/**
 * Validates portfolio simulation inputs.
 */
@Component
public class PortfolioValidator {

    /**
     * Validate inputs for portfolio simulation.
     *
     * @param trades list of executed trades (must not be null)
     * @param config portfolio configuration (must not be null)
     * @throws IllegalArgumentException when validation fails
     */
    public void validate(List<ExecutedTrade> trades, PortfolioConfig config) {
        if (config == null) {
            throw new IllegalArgumentException("config must not be null");
        }
        if (trades == null) {
            throw new IllegalArgumentException("trades must not be null");
        }

        if (config.getInitialCapital() <= 0.0d) {
            throw new IllegalArgumentException("initialCapital must be greater than zero");
        }
    }
}
