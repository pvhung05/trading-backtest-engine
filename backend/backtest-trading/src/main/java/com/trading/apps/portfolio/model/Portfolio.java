package com.trading.apps.portfolio.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Represents the current portfolio/account state.
 */
@Getter
@Builder
@AllArgsConstructor
public class Portfolio {

    /** The initial capital used for the simulation. */
    private final double initialCapital;

    /** The current total balance (cash + positions as currently valued). */
    private final double currentBalance;

    /** The current cash available. */
    private final double currentCash;
}

