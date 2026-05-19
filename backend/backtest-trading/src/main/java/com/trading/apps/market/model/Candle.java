package com.trading.apps.market.model;

import java.time.Instant;
import java.util.Objects;

/**
 * Domain model representing a single candle/bar of market data.
 * Immutable data transfer object for market data.
 *
 * @author Trading System
 */
public class Candle {

    private final Instant openTime;
    private final double open;
    private final double high;
    private final double low;
    private final double close;
    private final long volume;

    /**
     * Constructs a Candle with complete OHLCV data.
     *
     * @param openTime the opening time of the candle
     * @param open     the opening price
     * @param high     the highest price during the period
     * @param low      the lowest price during the period
     * @param close    the closing price
     * @param volume   the trading volume
     */
    public Candle(Instant openTime, double open, double high, double low, double close, long volume) {
        this.openTime = Objects.requireNonNull(openTime, "openTime cannot be null");
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;
    }

    public Instant getOpenTime() {
        return openTime;
    }

    public double getOpen() {
        return open;
    }

    public double getHigh() {
        return high;
    }

    public double getLow() {
        return low;
    }

    public double getClose() {
        return close;
    }

    public long getVolume() {
        return volume;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Candle candle = (Candle) o;
        return Double.compare(candle.open, open) == 0 &&
                Double.compare(candle.high, high) == 0 &&
                Double.compare(candle.low, low) == 0 &&
                Double.compare(candle.close, close) == 0 &&
                volume == candle.volume &&
                Objects.equals(openTime, candle.openTime);
    }

    @Override
    public int hashCode() {
        return Objects.hash(openTime, open, high, low, close, volume);
    }

    @Override
    public String toString() {
        return "Candle{" +
                "openTime=" + openTime +
                ", open=" + open +
                ", high=" + high +
                ", low=" + low +
                ", close=" + close +
                ", volume=" + volume +
                '}';
    }
}
