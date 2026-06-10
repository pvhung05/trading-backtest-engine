package com.trading.apps.backtest.service;

import java.util.Objects;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.ta4j.core.BarSeries;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;

import com.trading.apps.backtest.exception.BacktestException;
import com.trading.apps.backtest.mapper.TradingRecordMapper;
import com.trading.apps.backtest.model.BacktestCommand;
import com.trading.apps.backtest.model.BacktestResult;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.service.MarketDataService;
import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.strategy.factory.TradingStrategyFactory;
import com.trading.apps.strategy.service.StrategyFactoryRegistry;

/**
 * Orchestrates market data loading, strategy creation, backtest execution, and result mapping.
 */
@Service
@RequiredArgsConstructor
public class BacktestService {

    private final MarketDataService marketDataService;
    private final StrategyFactoryRegistry strategyFactoryRegistry;
    private final BacktestEngine backtestEngine;
    private final TradingRecordMapper tradingRecordMapper;

    /**
     * Executes a backtest and maps the trading record into a domain result.
     *
     * @param command the backtest command
     * @return the backtest result
     */
    public BacktestResult execute(BacktestCommand command) {
        Objects.requireNonNull(command, "command cannot be null");

        MarketDataRequest marketDataRequest = Objects.requireNonNull(command.getMarketDataRequest(), "marketDataRequest cannot be null");
        StrategyType strategyType = Objects.requireNonNull(command.getStrategyType(), "strategyType cannot be null");
        Objects.requireNonNull(command.getStrategyParameters(), "strategyParameters cannot be null");

        TradingStrategyFactory factory = strategyFactoryRegistry.getFactory(strategyType);
        int warmupBars = factory.getRequiredWarmupBars(command.getStrategyParameters());

        BarSeries series = marketDataService.load(marketDataRequest, warmupBars);
        if (series == null || series.getBarCount() == 0) {
            throw new BacktestException("No market data returned for backtest command");
        }

        Strategy strategy = factory.build(series, command.getStrategyParameters());
        TradingRecord tradingRecord = backtestEngine.run(series, strategy);

        return tradingRecordMapper.toResult(tradingRecord, series, marketDataRequest.getStartTime());
    }
}