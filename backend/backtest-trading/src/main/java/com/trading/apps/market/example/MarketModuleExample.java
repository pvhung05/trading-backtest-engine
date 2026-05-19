package com.trading.apps.market.example;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseStrategy;
import org.ta4j.core.Rule;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;
import org.ta4j.core.backtest.BarSeriesManager;
import org.ta4j.core.indicators.averages.SMAIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.rules.CrossedDownIndicatorRule;
import org.ta4j.core.rules.CrossedUpIndicatorRule;

import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.service.MarketDataService;

/**
 * Example demonstrating how to use the market module in a backtest.
 * Shows the clean boundary between backtest engine and market data provider.
 *
 * The backtest engine:
 * - Only calls MarketDataService
 * - Knows NOTHING about: Binance, API, caching, REST, JSON parsing
 * - Receives ready-to-use TA4J BarSeries
 *
 * @author Trading System
 */
@Component
public class MarketModuleExample {

    private static final Logger logger = LoggerFactory.getLogger(MarketModuleExample.class);

    private final MarketDataService marketDataService;

    /**
     * Constructor with dependency injection.
     *
     * @param marketDataService the market data service
     */
    public MarketModuleExample(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    /**
     * Example backtest using the market module.
     * Demonstrates the clean architecture separation.
     */
    public void runExampleBacktest() {
        logger.info("Starting example backtest using market module");

        try {
            // Step 1: Create market data request
            // Backend engine specifies WHAT data it needs
            MarketDataRequest request = new MarketDataRequest(
                    "BTCUSDT",
                    "5m",
                    Instant.parse("2024-01-01T00:00:00Z"),
                    Instant.parse("2024-01-31T23:59:59Z")
            );

            logger.info("Market data request: {}", request);

            // Step 2: Load market data
            // Backend engine does NOT know:
            // - If data comes from Binance API
            // - If data is cached
            // - If data is parsed from JSON
            // - How the BarSeries was constructed
            BarSeries barSeries = marketDataService.load(request);

            logger.info("Loaded market data: {} bars in series {}", barSeries.getBarCount(), barSeries.getName());

            // Step 3: Build strategy (using TA4J)
            Strategy strategy = buildSimpleSMAStrategy(barSeries);

            // Step 4: Run backtest
            BarSeriesManager manager = new BarSeriesManager(barSeries);
            TradingRecord tradingRecord = manager.run(strategy);

            // Step 5: Process results
            logger.info("Backtest results:");
            logger.info("- Total trades: {}", tradingRecord.getTrades().size());

            // Step 6: Demonstrate cache reuse
            logger.info("Cache size after first backtest: {}", marketDataService.getCacheSize());

            // Second backtest with different time range
            MarketDataRequest request2 = new MarketDataRequest(
                    "BTCUSDT",
                    "5m",
                    Instant.parse("2024-02-01T00:00:00Z"),
                    Instant.parse("2024-02-28T23:59:59Z")
            );

            logger.info("Second market data request: {}", request2);

            // This will reuse the cached BTCUSDT-5m dataset
            // (same cache key as first request)
            BarSeries barSeries2 = marketDataService.load(request2);

            logger.info("Loaded second market data: {} bars", barSeries2.getBarCount());
            logger.info("Cache size after second backtest: {}", marketDataService.getCacheSize());
            logger.info("Cache was reused! Same cache key for same symbol + timeframe");

        } catch (Exception e) {
            logger.error("Backtest failed", e);
        }
    }

    /**
     * Builds a simple SMA crossover strategy for demonstration.
     * Not a real trading strategy - just for example purposes.
     *
     * @param barSeries the bar series
     * @return a TA4J Strategy
     */
    private Strategy buildSimpleSMAStrategy(BarSeries barSeries) {
        ClosePriceIndicator closePrice = new ClosePriceIndicator(barSeries);
        SMAIndicator sma5 = new SMAIndicator(closePrice, 5);
        SMAIndicator sma20 = new SMAIndicator(closePrice, 20);

        // Buy rule: 5-SMA crosses above 20-SMA
        Rule buyingRule = new CrossedUpIndicatorRule(sma5, sma20);

        // Sell rule: 5-SMA crosses below 20-SMA
        Rule sellingRule = new CrossedDownIndicatorRule(sma5, sma20);

        return new BaseStrategy(buyingRule, sellingRule);
    }

    /**
     * Main method for standalone testing.
     *
     * @param args command line arguments (unused)
     */
    public static void main(String[] args) {
        System.out.println("This example requires Spring Boot context.");
        System.out.println("Run as: @SpringBootTest with MarketDataService autowired");
    }
}
