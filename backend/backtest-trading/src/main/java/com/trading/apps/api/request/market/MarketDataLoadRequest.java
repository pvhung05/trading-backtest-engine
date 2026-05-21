package com.trading.apps.api.request.market;

import java.time.Instant;
import java.time.format.DateTimeParseException;

import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.util.TimeframeUtil;

/**
 * Request model for loading market data from query parameters.
 */
public class MarketDataLoadRequest {

    private String symbol;
    private String timeframe;
    private String startTime;
    private String endTime;

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getTimeframe() {
        return timeframe;
    }

    public void setTimeframe(String timeframe) {
        this.timeframe = timeframe;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public MarketDataRequest toDomainRequest() {
        String normalizedSymbol = requireValue(symbol, "symbol").toUpperCase();
        String normalizedTimeframe = requireValue(timeframe, "timeframe").toLowerCase();
        if (!TimeframeUtil.isSupported(normalizedTimeframe)) {
            throw new IllegalArgumentException("unsupported timeframe: " + normalizedTimeframe);
        }

        try {
            Instant parsedStartTime = Instant.parse(requireValue(startTime, "startTime"));
            Instant parsedEndTime = parseEndTimeOrNow(endTime);
            return new MarketDataRequest(normalizedSymbol, normalizedTimeframe, parsedStartTime, parsedEndTime);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("startTime and endTime must be ISO-8601 instant format", ex);
        }
    }

    private Instant parseEndTimeOrNow(String rawEndTime) {
        if (rawEndTime == null || rawEndTime.isBlank()) {
            return Instant.now();
        }
        return Instant.parse(rawEndTime.trim());
    }

    private String requireValue(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim();
    }
}