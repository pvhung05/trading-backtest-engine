package com.trading.apps.market.model;

import java.time.Instant;
import java.util.Objects;

/**
 * Immutable request object for market data retrieval.
 * Contains symbol, timeframe, and time range for data loading.
 *
 * @author Trading System
 */
public class MarketDataRequest {

    private final String symbol;
    private final String timeframe;
    private final Instant startTime;
    private final Instant endTime;

    /**
     * Constructs a market data request.
     *
     * @param symbol    the trading symbol (e.g., "BTCUSDT")
     * @param timeframe the timeframe (e.g., "5m", "1h", "1d")
     * @param startTime the start time for the data range
     * @param endTime   the end time for the data range
     */
    public MarketDataRequest(String symbol, String timeframe, Instant startTime, Instant endTime) {
        this.symbol = Objects.requireNonNull(symbol, "symbol cannot be null");
        this.timeframe = Objects.requireNonNull(timeframe, "timeframe cannot be null");
        this.startTime = Objects.requireNonNull(startTime, "startTime cannot be null");
        this.endTime = Objects.requireNonNull(endTime, "endTime cannot be null");

        if (endTime.isBefore(startTime)) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
    }

    public String getSymbol() {
        return symbol;
    }

    public String getTimeframe() {
        return timeframe;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MarketDataRequest that = (MarketDataRequest) o;
        return Objects.equals(symbol, that.symbol) &&
                Objects.equals(timeframe, that.timeframe) &&
                Objects.equals(startTime, that.startTime) &&
                Objects.equals(endTime, that.endTime);
    }

    @Override
    public int hashCode() {
        return Objects.hash(symbol, timeframe, startTime, endTime);
    }

    @Override
    public String toString() {
        return "MarketDataRequest{" +
                "symbol='" + symbol + '\'' +
                ", timeframe='" + timeframe + '\'' +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                '}';
    }
}
