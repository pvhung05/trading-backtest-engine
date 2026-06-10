package com.trading.apps.api.controller.portfolio;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trading.apps.api.mapper.portfolio.PortfolioSimulationResponseMapper;
import com.trading.apps.api.request.portfolio.PortfolioSimulationRequest;
import com.trading.apps.api.response.portfolio.PortfolioSimulationResponse;
import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.execution.service.ExecutionSimulationService;
import com.trading.apps.portfolio.model.PortfolioConfig;
import com.trading.apps.portfolio.model.PortfolioResult;
import com.trading.apps.portfolio.service.PortfolioService;

/**
 * REST controller for portfolio simulation endpoints.
 * Orchestrates the full pipeline: market data → backtest → execution → portfolio calculation.
 */
@RestController
@RequestMapping("/api/portfolio")
@Validated
public class PortfolioController {

    private final ExecutionSimulationService executionSimulationService;
    private final PortfolioService portfolioService;
    private final PortfolioSimulationResponseMapper responseMapper;

    public PortfolioController(ExecutionSimulationService executionSimulationService,
            PortfolioService portfolioService,
            PortfolioSimulationResponseMapper responseMapper) {
        this.executionSimulationService = executionSimulationService;
        this.portfolioService = portfolioService;
        this.responseMapper = responseMapper;
    }

    /**
     * Runs a full portfolio simulation.
     *
     * <p>Pipeline steps:
     * <ol>
     *   <li>Load market data and run backtest for the given strategy</li>
     *   <li>Simulate trade execution with commission, slippage, and position sizing</li>
     *   <li>Calculate portfolio equity curve and statistics from executed trades</li>
     * </ol>
     *
     * @param request the simulation parameters (market data, strategy, execution config, capital)
     * @return the complete simulation result including equity curve and statistics
     */
    @PostMapping("/simulate")
    public ResponseEntity<PortfolioSimulationResponse> simulate(
            @RequestBody PortfolioSimulationRequest request) {

        var executionCommand = request.toExecutionCommand();
        List<ExecutedTrade> executedTrades = executionSimulationService.execute(executionCommand);

        PortfolioConfig portfolioConfig = request.toPortfolioConfig();
        PortfolioResult portfolioResult = portfolioService.calculate(executedTrades, portfolioConfig);

        PortfolioSimulationResponse response = responseMapper.toResponse(
                executionCommand, portfolioResult);

        return ResponseEntity.ok(response);
    }
}
