package com.trading.apps.market.util;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import com.trading.apps.market.exception.MarketDataException;

/**
 * Utility class for timeframe conversions and validations.
 * Provides mapping between timeframe strings and Java Duration objects.
 *
 * @author Trading System
 */
public class TimeframeUtil {

    private static final Map<String, Duration> TIMEFRAME_DURATIONS = new HashMap<>();

    static {
        TIMEFRAME_DURATIONS.put("1m", Duration.ofMinutes(1));
        TIMEFRAME_DURATIONS.put("5m", Duration.ofMinutes(5));
        TIMEFRAME_DURATIONS.put("15m", Duration.ofMinutes(15));
        TIMEFRAME_DURATIONS.put("30m", Duration.ofMinutes(30));
        TIMEFRAME_DURATIONS.put("1h", Duration.ofHours(1));
        TIMEFRAME_DURATIONS.put("2h", Duration.ofHours(2));
        TIMEFRAME_DURATIONS.put("4h", Duration.ofHours(4));
        TIMEFRAME_DURATIONS.put("6h", Duration.ofHours(6));
        TIMEFRAME_DURATIONS.put("8h", Duration.ofHours(8));
        TIMEFRAME_DURATIONS.put("12h", Duration.ofHours(12));
        TIMEFRAME_DURATIONS.put("1d", Duration.ofDays(1));
        TIMEFRAME_DURATIONS.put("3d", Duration.ofDays(3));
        TIMEFRAME_DURATIONS.put("1w", Duration.ofDays(7));
        TIMEFRAME_DURATIONS.put("1mo", Duration.ofDays(30));
    }

    private TimeframeUtil() {
        // Utility class - no instantiation
    }

    /**
     * Converts timeframe string to Duration.
     *
     * @param timeframe the timeframe string (e.g., "5m", "1h", "1d")
     * @return the Duration equivalent
     * @throws MarketDataException if timeframe is not recognized
     */
    public static Duration toDuration(String timeframe) {
        Objects.requireNonNull(timeframe, "timeframe cannot be null");

        Duration duration = TIMEFRAME_DURATIONS.get(timeframe);
        if (duration == null) {
            throw new MarketDataException("Unsupported timeframe: " + timeframe);
        }
        return duration;
    }

    /**
     * Validates if the timeframe is supported.
     *
     * @param timeframe the timeframe to validate
     * @return true if timeframe is supported
     */
    public static boolean isSupported(String timeframe) {
        return TIMEFRAME_DURATIONS.containsKey(timeframe);
    }

    /**
     * Gets all supported timeframes.
     *
     * @return an array of supported timeframe strings
     */
    public static String[] getSupportedTimeframes() {
        return TIMEFRAME_DURATIONS.keySet().toArray(new String[0]);
    }
}
