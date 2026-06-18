package com.trading.apps.execution.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.ta4j.core.BarSeries;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;

import com.trading.apps.api.mapper.portfolio.PortfolioSimulationResponseMapper;
import com.trading.apps.api.mapper.simulation.FullSimulationResponseMapper;
import com.trading.apps.api.request.portfolio.PortfolioSimulationRequest;
import com.trading.apps.api.response.simulation.FullSimulationResponse;
import com.trading.apps.api.response.portfolio.PortfolioSimulationResponse;
import com.trading.apps.backtest.service.BacktestEngine;
import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.execution.model.ExecutionSimulationCommand;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.service.MarketDataService;
import com.trading.apps.metrics.model.MetricsResult;
import com.trading.apps.metrics.service.MetricsService;
import com.trading.apps.portfolio.model.PortfolioConfig;
import com.trading.apps.portfolio.model.PortfolioResult;
import com.trading.apps.portfolio.service.PortfolioService;
import com.trading.apps.strategy.factory.TradingStrategyFactory;
import com.trading.apps.strategy.service.StrategyFactoryRegistry;

/**
 * Orchestrates market loading, strategy creation, backtest execution,
 * and execution simulation with candle-aware portfolio calculation.
 */
@Service
public class ExecutionSimulationService {

    private final MarketDataService marketDataService;
    private final StrategyFactoryRegistry strategyFactoryRegistry;
    private final BacktestEngine backtestEngine;
    private final ExecutionService executionService;
    private final PortfolioService portfolioService;
    private final MetricsService metricsService;
    private final PortfolioSimulationResponseMapper responseMapper;
    private final FullSimulationResponseMapper fullResponseMapper;

    public ExecutionSimulationService(
            MarketDataService marketDataService,
            StrategyFactoryRegistry strategyFactoryRegistry,
            BacktestEngine backtestEngine,
            ExecutionService executionService,
            PortfolioService portfolioService,
            MetricsService metricsService,
            PortfolioSimulationResponseMapper responseMapper,
            FullSimulationResponseMapper fullResponseMapper) {
        this.marketDataService = marketDataService;
        this.strategyFactoryRegistry = strategyFactoryRegistry;
        this.backtestEngine = backtestEngine;
        this.executionService = executionService;
        this.portfolioService = portfolioService;
        this.metricsService = metricsService;
        this.responseMapper = responseMapper;
        this.fullResponseMapper = fullResponseMapper;
    }

    /**
     * Executes the full simulation pipeline and returns executed trades.
     */
    public List<ExecutedTrade> execute(ExecutionSimulationCommand command) {
        Objects.requireNonNull(command, "command cannot be null");

        MarketDataRequest marketDataRequest = Objects.requireNonNull(
                command.getMarketDataRequest(), "marketDataRequest cannot be null");
        Objects.requireNonNull(command.getStrategyType(), "strategyType cannot be null");
        Objects.requireNonNull(command.getStrategyParameters(), "strategyParameters cannot be null");
        Objects.requireNonNull(command.getExecutionConfig(), "executionConfig cannot be null");

        TradingStrategyFactory factory = strategyFactoryRegistry.getFactory(command.getStrategyType());
        int warmupBars = factory.getRequiredWarmupBars(command.getStrategyParameters());

        BarSeries series = marketDataService.load(marketDataRequest, warmupBars);
        if (series == null || series.getBarCount() == 0) {
            throw new IllegalArgumentException("No market data returned for execution simulation");
        }

        Strategy strategy = factory.build(series, command.getStrategyParameters());
        TradingRecord tradingRecord = backtestEngine.run(series, strategy);

        return executionService.execute(
                tradingRecord,
                series,
                command.getExecutionConfig(),
                command.getCapital(),
                marketDataRequest.getStartTime());
    }

    /**
     * Executes the full simulation pipeline and returns the complete portfolio simulation response.
     */
    public PortfolioSimulationResponse simulate(PortfolioSimulationRequest request) {
        Objects.requireNonNull(request, "request cannot be null");

        ExecutionSimulationCommand command = request.toExecutionCommand();
        MarketDataRequest marketDataRequest = command.getMarketDataRequest();

        TradingStrategyFactory factory = strategyFactoryRegistry.getFactory(command.getStrategyType());
        int warmupBars = factory.getRequiredWarmupBars(command.getStrategyParameters());

        BarSeries series = marketDataService.load(marketDataRequest, warmupBars);
        if (series == null || series.getBarCount() == 0) {
            throw new IllegalArgumentException("No market data returned for portfolio simulation");
        }

        Strategy strategy = factory.build(series, command.getStrategyParameters());
        TradingRecord tradingRecord = backtestEngine.run(series, strategy);

        List<ExecutedTrade> executedTrades = executionService.execute(
                tradingRecord,
                series,
                command.getExecutionConfig(),
                command.getCapital(),
                marketDataRequest.getStartTime());

        PortfolioConfig portfolioConfig = request.toPortfolioConfig();
        PortfolioResult portfolioResult = portfolioService.calculate(
                executedTrades, series, portfolioConfig, warmupBars);

        return responseMapper.toResponse(command, portfolioResult);
    }

    /**
     * Executes the full simulation pipeline and returns trades, equity curve, and all metrics
     * in a single response.
     *
     * <p>Pipeline steps (executed exactly once):
     * <ol>
     *   <li>Load market data</li>
     *   <li>Build and run strategy backtest</li>
     *   <li>Execute trades (with slippage/commission)</li>
     *   <li>Calculate equity curve</li>
     *   <li>Calculate performance metrics</li>
     * </ol>
     *
     * @param request portfolio simulation request containing all configuration
     * @return unified response with trades, equity curve, and 22 performance metrics
     */
    public FullSimulationResponse fullSimulation(PortfolioSimulationRequest request) {
        Objects.requireNonNull(request, "request cannot be null");

        ExecutionSimulationCommand command = request.toExecutionCommand();
        MarketDataRequest marketDataRequest = command.getMarketDataRequest();

        TradingStrategyFactory factory = strategyFactoryRegistry.getFactory(command.getStrategyType());
        int warmupBars = factory.getRequiredWarmupBars(command.getStrategyParameters());

        BarSeries series = marketDataService.load(marketDataRequest, warmupBars);
        if (series == null || series.getBarCount() == 0) {
            throw new IllegalArgumentException("No market data returned for full simulation");
        }

        Strategy strategy = factory.build(series, command.getStrategyParameters());
        TradingRecord tradingRecord = backtestEngine.run(series, strategy);

        List<ExecutedTrade> executedTrades = executionService.execute(
                tradingRecord,
                series,
                command.getExecutionConfig(),
                command.getCapital(),
                marketDataRequest.getStartTime());

        PortfolioConfig portfolioConfig = request.toPortfolioConfig();
        PortfolioResult portfolioResult = portfolioService.calculate(
                executedTrades, series, portfolioConfig, warmupBars);

        MetricsResult metricsResult = metricsService.calculate(executedTrades, portfolioResult);

        return fullResponseMapper.toResponse(command, executedTrades, portfolioResult, metricsResult);
    }
}
