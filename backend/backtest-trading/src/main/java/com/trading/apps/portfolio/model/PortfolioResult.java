package com.trading.apps.portfolio.model;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

/**
 * Final result of portfolio simulation.
 */
@Getter
@Builder
public class PortfolioResult {

    /** Portfolio summary. */
    private final Portfolio portfolio;

    /** Snapshots after each applied executed trade. */
    private final List<PortfolioSnapshot> snapshots;

    /** Equity curve constructed from snapshots. */
    private final List<EquityPoint> equityCurve;
}
