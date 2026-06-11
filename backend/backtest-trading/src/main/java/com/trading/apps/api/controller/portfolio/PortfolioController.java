package com.trading.apps.api.controller.portfolio;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trading.apps.api.request.portfolio.PortfolioSimulationRequest;
import com.trading.apps.api.response.portfolio.PortfolioSimulationResponse;
import com.trading.apps.execution.service.ExecutionSimulationService;

/**
 * REST controller for portfolio simulation endpoints.
 * Orchestrates the full pipeline: market data → backtest → execution → portfolio calculation.
 */
@RestController
@RequestMapping("/api/portfolio")
@Validated
public class PortfolioController {

    private final ExecutionSimulationService executionSimulationService;

    public PortfolioController(ExecutionSimulationService executionSimulationService) {
        this.executionSimulationService = executionSimulationService;
    }

    /**
     * Runs a full portfolio simulation with candle-level equity curve.
     *
     * <p>Pipeline steps:
     * <ol>
     *   <li>Load market data and run backtest for the given strategy</li>
     *   <li>Simulate trade execution with commission, slippage, and position sizing</li>
     *   <li>Calculate portfolio equity curve at every candle bar (mark-to-market)</li>
     * </ol>
     *
     * @param request the simulation parameters (market data, strategy, execution config, capital)
     * @return the complete simulation result including equity curve and statistics
     */
    @PostMapping("/simulate")
    public ResponseEntity<PortfolioSimulationResponse> simulate(
            @RequestBody PortfolioSimulationRequest request) {

        PortfolioSimulationResponse response = executionSimulationService.simulate(request);
        return ResponseEntity.ok(response);
    }
}
