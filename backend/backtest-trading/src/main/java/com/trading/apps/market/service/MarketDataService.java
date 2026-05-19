package com.trading.apps.market.service;

import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.ta4j.core.BarSeries;

import com.trading.apps.market.cache.CacheKeyGenerator;
import com.trading.apps.market.cache.MarketDataCache;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.provider.MarketDataProvider;
import com.trading.apps.market.slicer.SeriesSlicer;

/**
 * Service layer for market data retrieval.
 * Entry point of the market module for the backtest engine.
 *
 * Responsibilities:
 * - Manage cache lifecycle
 * - Route requests to appropriate data provider
 * - Slice full dataset to requested time range
 * - Ensure clean separation between backtest engine and market data sources
 *
 * Architecture:
 * The backtest engine calls only this service. It doesn't know about:
 * - Binance API, JSON parsing, REST calls
 * - Cache mechanisms
 * - CSV, Parquet, or other data sources
 * - TA4J details
 *
 * @author Trading System
 */
@Service
public class MarketDataService {

    private static final Logger logger = LoggerFactory.getLogger(MarketDataService.class);

    private final MarketDataCache cache;
    private final MarketDataProvider provider;

    /**
     * Constructs a MarketDataService with dependencies.
     *
     * @param cache    the market data cache
     * @param provider the market data provider implementation
     */
    public MarketDataService(MarketDataCache cache, MarketDataProvider provider) {
        this.cache = Objects.requireNonNull(cache, "cache cannot be null");
        this.provider = Objects.requireNonNull(provider, "provider cannot be null");
    }

    /**
     * Loads market data for the specified request.
     *
     * Process:
     * 1. Generate cache key from symbol and timeframe
     * 2. Check if full dataset is cached
     * 3. If cache hit: reuse cached dataset
     * 4. If cache miss: load full dataset from provider, then cache it
     * 5. Slice the full cached dataset to the requested time range
     * 6. Return sliced BarSeries
     *
     * Cache key format: SYMBOL-TIMEFRAME (e.g., "BTCUSDT-5m")
     * This enables efficient reuse across multiple backtest runs with different time ranges.
     *
     * @param request the market data request containing symbol, timeframe, and time range
     * @return a TA4J BarSeries sliced to the requested time range
     */
    public BarSeries load(MarketDataRequest request) {
        Objects.requireNonNull(request, "request cannot be null");

        String cacheKey = CacheKeyGenerator.generateKey(request.getSymbol(), request.getTimeframe());
        logger.info("Processing market data request for cache key: {} with time range [{}, {}]",
                cacheKey, request.getStartTime(), request.getEndTime());

        // Step 1 & 2: Check cache
        Optional<BarSeries> cachedSeries = cache.get(cacheKey);

        // Step 3 & 4: Get full dataset (from cache or load from provider)
        BarSeries fullSeries = cachedSeries.orElseGet(() -> {
            logger.info("Cache miss for key: {}. Loading from provider", cacheKey);
            BarSeries series = provider.provide(request);
            cache.put(cacheKey, series);
            return series;
        });

        // Step 5: Slice to requested time range
        BarSeries slicedSeries = SeriesSlicer.slice(fullSeries, request.getStartTime(), request.getEndTime());

        logger.info("Returning sliced BarSeries with {} bars for request: {}", slicedSeries.getBarCount(), request);
        return slicedSeries;
    }

    /**
     * Clears all cached market data.
     * Useful for testing and cache invalidation scenarios.
     */
    public void clearCache() {
        cache.clear();
        logger.info("Market data cache cleared");
    }

    /**
     * Gets the current cache size (number of cached symbol-timeframe combinations).
     *
     * @return the number of cached entries
     */
    public int getCacheSize() {
        return cache.size();
    }
}
