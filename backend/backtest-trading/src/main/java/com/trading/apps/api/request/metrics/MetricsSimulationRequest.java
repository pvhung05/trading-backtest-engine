package com.trading.apps.api.request.metrics;

import java.util.List;

import lombok.Data;

import com.trading.apps.api.response.execution.ExecutedTradeResponse;
import com.trading.apps.api.response.portfolio.EquityCurvePointResponse;
import com.trading.apps.api.response.portfolio.EquityCurveResponse;
import com.trading.apps.api.response.portfolio.PortfolioStatsResponse;

/**
 * Request DTO for calculating performance metrics.
 * Combines executed trades and portfolio simulation result.
 */
@Data
public class MetricsSimulationRequest {

    private List<ExecutedTradeResponse> trades;

    private EquityCurveResponse equityCurve;

    private PortfolioStatsResponse stats;
}
