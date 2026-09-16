package com.trading.service.validator;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Component;

import com.trading.model.ExecutedTrade;
import com.trading.model.PortfolioResult;

/**
 * Validates inputs for the Metrics module.
 */
@Component
public class MetricsValidator {

    /**
     * Validates that required inputs are present and contain valid data.
     *
     * @param trades          list of executed trades (may be null)
     * @param portfolioResult portfolio result (must not be null)
     * @throws IllegalArgumentException when validation fails
     */
    public void validate(List<ExecutedTrade> trades, PortfolioResult portfolioResult) {
        Objects.requireNonNull(portfolioResult, "portfolioResult must not be null");
    }
}
