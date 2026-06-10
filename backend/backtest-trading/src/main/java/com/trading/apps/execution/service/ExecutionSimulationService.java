package com.trading.apps.execution.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.ta4j.core.BarSeries;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;

import com.trading.apps.backtest.service.BacktestEngine;
import com.trading.apps.execution.model.ExecutionSimulationCommand;
import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.service.MarketDataService;
import com.trading.apps.strategy.factory.TradingStrategyFactory;
import com.trading.apps.strategy.service.StrategyFactoryRegistry;

/**
 * Orchestrates market loading, strategy creation, backtest execution, and execution simulation.
 */
@Service
public class ExecutionSimulationService {

    private final MarketDataService marketDataService;
    private final StrategyFactoryRegistry strategyFactoryRegistry;
    private final BacktestEngine backtestEngine;
    private final ExecutionService executionService;

    public ExecutionSimulationService(MarketDataService marketDataService,
            StrategyFactoryRegistry strategyFactoryRegistry,
            BacktestEngine backtestEngine,
            ExecutionService executionService) {
        this.marketDataService = marketDataService;
        this.strategyFactoryRegistry = strategyFactoryRegistry;
        this.backtestEngine = backtestEngine;
        this.executionService = executionService;
    }

    public List<ExecutedTrade> execute(ExecutionSimulationCommand command) {
        Objects.requireNonNull(command, "command cannot be null");

        MarketDataRequest marketDataRequest = Objects.requireNonNull(command.getMarketDataRequest(), "marketDataRequest cannot be null");
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
}