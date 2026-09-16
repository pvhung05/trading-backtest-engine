package com.trading.service.market;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.ta4j.core.BarSeries;

/**
 * Simple in-memory cache for market data.
 * Stores BarSeries indexed by cache key (symbol-timeframe).
 *
 * @author Trading System
 */
public class MarketDataCache {

    private static final Logger logger = LoggerFactory.getLogger(MarketDataCache.class);

    private final Map<String, BarSeries> cache = new HashMap<>();

    /**
     * Retrieves a cached BarSeries by key.
     *
     * @param key the cache key (symbol-timeframe)
     * @return Optional containing the BarSeries if found, empty otherwise
     */
    public Optional<BarSeries> get(String key) {
        BarSeries series = cache.get(key);
        if (series != null) {
            logger.debug("Cache hit for key: {}", key);
            return Optional.of(series);
        }
        logger.debug("Cache miss for key: {}", key);
        return Optional.empty();
    }

    /**
     * Stores a BarSeries in the cache.
     *
     * @param key    the cache key (symbol-timeframe)
     * @param series the BarSeries to cache
     */
    public void put(String key, BarSeries series) {
        cache.put(key, series);
        logger.debug("Cached BarSeries for key: {} with {} bars", key, series.getBarCount());
    }

    /**
     * Removes a specific cache entry.
     *
     * @param key the cache key to remove
     */
    public void remove(String key) {
        cache.remove(key);
        logger.debug("Removed cache entry for key: {}", key);
    }

    /**
     * Checks if a cache entry exists.
     *
     * @param key the cache key to check
     * @return true if entry exists, false otherwise
     */
    public boolean contains(String key) {
        return cache.containsKey(key);
    }

    /**
     * Clears all cached entries.
     */
    public void clear() {
        cache.clear();
        logger.info("Cache cleared");
    }

    /**
     * Returns the number of cached entries.
     *
     * @return cache size
     */
    public int size() {
        return cache.size();
    }

    /**
     * Returns all cache keys.
     *
     * @return set of cache keys
     */
    public Set<String> keys() {
        return new HashSet<>(cache.keySet());
    }
}
