package com.trading.apps.market.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class MarketDataRequestTest {

    @Test
    void shouldExposeRequestFields() {
        Instant startTime = Instant.parse("2024-01-01T00:00:00Z");
        Instant endTime = Instant.parse("2024-01-01T01:00:00Z");

        MarketDataRequest request = new MarketDataRequest("BTCUSDT", "5m", startTime, endTime);

        assertEquals("BTCUSDT", request.getSymbol());
        assertEquals("5m", request.getTimeframe());
        assertEquals(startTime, request.getStartTime());
        assertEquals(endTime, request.getEndTime());
    }

    @Test
    void shouldRejectEndTimeBeforeStartTime() {
        Instant startTime = Instant.parse("2024-01-01T01:00:00Z");
        Instant endTime = Instant.parse("2024-01-01T00:00:00Z");

        assertThrows(IllegalArgumentException.class,
                () -> new MarketDataRequest("BTCUSDT", "5m", startTime, endTime));
    }

    @Test
    void shouldRejectNullValues() {
        Instant now = Instant.parse("2024-01-01T00:00:00Z");

        assertThrows(NullPointerException.class,
                () -> new MarketDataRequest(null, "5m", now, now));
        assertThrows(NullPointerException.class,
                () -> new MarketDataRequest("BTCUSDT", null, now, now));
        assertThrows(NullPointerException.class,
                () -> new MarketDataRequest("BTCUSDT", "5m", null, now));
        assertThrows(NullPointerException.class,
                () -> new MarketDataRequest("BTCUSDT", "5m", now, null));
    }
}