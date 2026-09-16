package com.trading.dto.request;

import java.util.List;

import lombok.Data;

import com.trading.dto.response.ExecutedTradeResponse;
import com.trading.dto.response.EquityCurvePointResponse;
import com.trading.dto.response.EquityCurveResponse;
import com.trading.dto.response.PortfolioStatsResponse;

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
