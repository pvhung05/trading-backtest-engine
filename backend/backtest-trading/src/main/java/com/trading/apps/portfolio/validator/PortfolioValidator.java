package com.trading.apps.portfolio.validator;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Component;
import org.ta4j.core.BarSeries;

import com.trading.apps.business.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.PortfolioConfig;

/**
 * Validates portfolio simulation inputs.
 */
@Component
public class PortfolioValidator {

    /**
     * Validate inputs for candle-aware portfolio simulation.
     *
     * @param trades list of executed trades (must not be null)
     * @param series bar series (must not be null)
     * @param config portfolio configuration (must not be null)
     * @throws IllegalArgumentException when validation fails
     */
    public void validate(List<ExecutedTrade> trades, BarSeries series, PortfolioConfig config) {
        Objects.requireNonNull(config, "config must not be null");
        Objects.requireNonNull(series, "series must not be null");
        Objects.requireNonNull(trades, "trades must not be null");

        if (config.getInitialCapital() <= 0.0d) {
            throw new IllegalArgumentException("initialCapital must be greater than zero");
        }
        if (series.getBarCount() == 0) {
            throw new IllegalArgumentException("bar series must not be empty");
        }
    }
}
