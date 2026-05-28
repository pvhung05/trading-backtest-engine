package com.trading.apps.market.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseBarSeriesBuilder;

import com.trading.apps.market.cache.CacheKeyGenerator;
import com.trading.apps.market.cache.MarketDataCache;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.model.MarketDataCacheSnapshot;
import com.trading.apps.market.provider.MarketDataProvider;
import com.trading.apps.market.slicer.SeriesSlicer;
import com.trading.apps.market.util.TimeframeUtil;

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

        Optional<BarSeries> cachedSeries = cache.get(cacheKey);
        BarSeries fullSeries = cachedSeries.map(series -> extendCachedSeriesIfNeeded(cacheKey, series, request))
                .orElseGet(() -> {
                    logger.info("Cache miss for key: {}. Loading from provider", cacheKey);
                    BarSeries series = provider.provide(request);
                    cache.put(cacheKey, series);
                    return series;
                });

        // Slice to requested time range
        BarSeries slicedSeries = SeriesSlicer.slice(fullSeries, request.getStartTime(), request.getEndTime());

        logger.info("Returning sliced BarSeries with {} bars for request: {}", slicedSeries.getBarCount(), request);
        return slicedSeries;
    }

    public BarSeries load(MarketDataRequest request, int warmupBars) {
        Objects.requireNonNull(request, "request cannot be null");

        if (warmupBars <= 0) {
            return load(request);
        }

        Instant warmupStartTime = request.getStartTime().minus(TimeframeUtil.toDuration(request.getTimeframe()).multipliedBy(warmupBars));
        MarketDataRequest expandedRequest = new MarketDataRequest(
                request.getSymbol(),
                request.getTimeframe(),
                warmupStartTime,
                request.getEndTime()
        );

        logger.info(
                "Loading market data with warmup: {} extra bars for request {} (expanded start: {})",
                warmupBars,
                request,
                warmupStartTime
        );

        return load(expandedRequest);
    }

    private BarSeries extendCachedSeriesIfNeeded(String cacheKey, BarSeries cachedSeries, MarketDataRequest request) {
        BarSeries expandedSeries = cachedSeries;

        Instant firstBarTime = getFirstBarTime(expandedSeries);
        if (firstBarTime != null && request.getStartTime().isBefore(firstBarTime)) {
            expandedSeries = prependMissingBars(cacheKey, expandedSeries, request, firstBarTime);
        }

        Instant lastBarTime = getLastBarTime(expandedSeries);
        if (lastBarTime != null && request.getEndTime().isAfter(lastBarTime)) {
            expandedSeries = appendMissingBars(cacheKey, expandedSeries, request, lastBarTime);
        }

        if (expandedSeries != cachedSeries) {
            cache.put(cacheKey, expandedSeries);
        }

        return expandedSeries;
    }

    private BarSeries prependMissingBars(String cacheKey, BarSeries cachedSeries, MarketDataRequest request, Instant firstBarTime) {
        Instant extensionEndTime = firstBarTime.minusMillis(1);
        logger.info(
                "Extending cached series backward for key: {} from {} to {}",
                cacheKey,
                request.getStartTime(),
                extensionEndTime
        );

        MarketDataRequest extensionRequest = new MarketDataRequest(
                request.getSymbol(),
                request.getTimeframe(),
                request.getStartTime(),
                extensionEndTime
        );

        BarSeries extensionSeries = provider.provide(extensionRequest);
        return mergeSeries(extensionSeries, cachedSeries);
    }

    private BarSeries appendMissingBars(String cacheKey, BarSeries cachedSeries, MarketDataRequest request, Instant lastBarTime) {
        Instant extensionStartTime = lastBarTime.plusMillis(1);
        logger.info(
                "Extending cached series forward for key: {} from {} to {}",
                cacheKey,
                extensionStartTime,
                request.getEndTime()
        );

        MarketDataRequest extensionRequest = new MarketDataRequest(
                request.getSymbol(),
                request.getTimeframe(),
                extensionStartTime,
                request.getEndTime()
        );

        BarSeries extensionSeries = provider.provide(extensionRequest);
        return mergeSeries(cachedSeries, extensionSeries);
    }

    private BarSeries mergeSeries(BarSeries firstSeries, BarSeries secondSeries) {
        BarSeries mergedSeries = new BaseBarSeriesBuilder()
                .withName(firstSeries.getName())
                .build();

        Set<Instant> seenEndTimes = new HashSet<>();
        addBarsIfMissing(mergedSeries, firstSeries, seenEndTimes);
        addBarsIfMissing(mergedSeries, secondSeries, seenEndTimes);

        return mergedSeries;
    }

    private void addBarsIfMissing(BarSeries targetSeries, BarSeries sourceSeries, Set<Instant> seenEndTimes) {
        for (int i = 0; i < sourceSeries.getBarCount(); i++) {
            Bar bar = sourceSeries.getBar(i);
            if (seenEndTimes.add(bar.getEndTime())) {
                targetSeries.addBar(bar);
            }
        }
    }

    private Instant getFirstBarTime(BarSeries series) {
        if (series.getBarCount() == 0) {
            return null;
        }

        return series.getBar(0).getEndTime();
    }

    private Instant getLastBarTime(BarSeries series) {
        if (series.getBarCount() == 0) {
            return null;
        }

        return series.getBar(series.getBarCount() - 1).getEndTime();
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
     * Removes a specific cache entry identified by cache key (symbol-timeframe).
     * @param cacheKey the cache key to remove
     */
    public void removeCacheEntry(String cacheKey) {
        if (cache.contains(cacheKey)) {
            cache.remove(cacheKey);
            logger.info("Removed cache entry for key: {}", cacheKey);
        } else {
            logger.debug("Attempted to remove non-existing cache key: {}", cacheKey);
        }
    }

    /**
     * Gets the current cache size (number of cached symbol-timeframe combinations).
     *
     * @return the number of cached entries
     */
    public int getCacheSize() {
        return cache.size();
    }

    /**
     * Returns a snapshot of the current cache contents.
     *
     * @return list of cached symbol/timeframe ranges
     */
    public java.util.List<MarketDataCacheSnapshot> getCacheSnapshots() {
        java.util.List<MarketDataCacheSnapshot> snapshots = new ArrayList<>();

        for (String key : cache.keys()) {
            cache.get(key).ifPresent(series -> {
                Instant startTime = getFirstBarTime(series);
                Instant endTime = getLastBarTime(series);

                if (startTime != null && endTime != null) {
                    String[] parts = key.split("-", 2);
                    String symbol = parts.length > 0 ? parts[0] : key;
                    String timeframe = parts.length > 1 ? parts[1] : "";

                    snapshots.add(new MarketDataCacheSnapshot(
                            key,
                            symbol,
                            timeframe,
                            startTime,
                            endTime,
                            series.getBarCount()
                    ));
                }
            });
        }

        snapshots.sort(java.util.Comparator.comparing(MarketDataCacheSnapshot::cacheKey));
        return snapshots;
    }
}
