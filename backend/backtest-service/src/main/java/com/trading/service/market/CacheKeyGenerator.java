package com.trading.service.market;

/**
 * Utility class for generating cache keys.
 *
 * @author Trading System
 */
public final class CacheKeyGenerator {

    private static final String SEPARATOR = "-";

    private CacheKeyGenerator() {
    }

    /**
     * Generates a cache key from symbol and timeframe.
     * Format: SYMBOL-TIMEFRAME (e.g., "BTCUSDT-5m")
     *
     * @param symbol    the trading symbol (e.g., "BTCUSDT")
     * @param timeframe the time interval (e.g., "5m", "1h", "1d")
     * @return the generated cache key
     */
    public static String generateKey(String symbol, String timeframe) {
        if (symbol == null || symbol.isBlank()) {
            throw new IllegalArgumentException("Symbol cannot be null or blank");
        }
        if (timeframe == null || timeframe.isBlank()) {
            throw new IllegalArgumentException("Timeframe cannot be null or blank");
        }
        return symbol + SEPARATOR + timeframe;
    }

    /**
     * Extracts the symbol from a cache key.
     *
     * @param cacheKey the cache key (symbol-timeframe)
     * @return the symbol portion
     */
    public static String extractSymbol(String cacheKey) {
        if (cacheKey == null || !cacheKey.contains(SEPARATOR)) {
            return cacheKey;
        }
        return cacheKey.substring(0, cacheKey.indexOf(SEPARATOR));
    }

    /**
     * Extracts the timeframe from a cache key.
     *
     * @param cacheKey the cache key (symbol-timeframe)
     * @return the timeframe portion
     */
    public static String extractTimeframe(String cacheKey) {
        if (cacheKey == null || !cacheKey.contains(SEPARATOR)) {
            return "";
        }
        return cacheKey.substring(cacheKey.indexOf(SEPARATOR) + 1);
    }
}
