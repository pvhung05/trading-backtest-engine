package com.trading.apps.portfolio.model;

import lombok.Builder;
import lombok.Getter;

/**
 * Configuration for portfolio simulation.
 */
@Getter
@Builder
public class PortfolioConfig {

    /** The initial capital used to initialize the portfolio. */
    private final double initialCapital;
}
