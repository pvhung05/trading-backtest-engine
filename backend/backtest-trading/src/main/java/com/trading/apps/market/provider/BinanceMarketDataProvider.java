package com.trading.apps.market.provider;

import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.ta4j.core.BarSeries;

import com.trading.apps.market.loader.BinanceApiLoader;
import com.trading.apps.market.mapper.CandleMapper;
import com.trading.apps.market.model.Candle;
import com.trading.apps.market.model.MarketDataRequest;

/**
 * Binance implementation of MarketDataProvider.
 * Orchestrates loading market data from Binance API.
 *
 * Responsibilities:
 * - Load full dataset from Binance API
 * - Convert raw data to domain Candle objects
 * - Convert Candles to TA4J BarSeries format
 *
 * Does NOT call API directly (delegated to BinanceApiLoader).
 * Does NOT handle caching (delegated to MarketDataService).
 *
 * @author Trading System
 */
@Component
public class BinanceMarketDataProvider implements MarketDataProvider {

    private static final Logger logger = LoggerFactory.getLogger(BinanceMarketDataProvider.class);

    private final BinanceApiLoader apiLoader;

    /**
     * Constructs a BinanceMarketDataProvider with dependency injection.
     *
     * @param apiLoader the API loader for Binance calls
     */
    public BinanceMarketDataProvider(BinanceApiLoader apiLoader) {
        this.apiLoader = Objects.requireNonNull(apiLoader, "apiLoader cannot be null");
    }

    /**
     * Provides a full BarSeries from Binance API for the requested symbol and timeframe.
     *
     * Process:
     * 1. Load candles from Binance API
     * 2. Convert to domain Candle objects
     * 3. Convert to TA4J BarSeries
     *
     * @param request the market data request
     * @return a TA4J BarSeries containing the full dataset from Binance
     */
    @Override
    public BarSeries provide(MarketDataRequest request) {
        Objects.requireNonNull(request, "request cannot be null");

        logger.info("Loading market data from Binance for request: {}", request);

        // Step 1: Load candles from API
        List<Candle> candles = apiLoader.loadCandles(
                request.getSymbol(),
                request.getTimeframe(),
                request.getStartTime(),
                request.getEndTime()
        );

        // Step 2: Convert to TA4J BarSeries
        BarSeries barSeries = CandleMapper.toBarSeries(
                candles,
                request.getSymbol(),
                request.getTimeframe()
        );

        logger.info("Provided BarSeries from Binance with {} bars", barSeries.getBarCount());
        return barSeries;
    }
}
