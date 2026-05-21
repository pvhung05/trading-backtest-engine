package com.trading.apps.api.request.market;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class MarketDataLoadRequestTest {

    @Test
    void shouldUseCurrentTimeWhenEndTimeIsMissing() {
        MarketDataLoadRequest request = new MarketDataLoadRequest();
        request.setSymbol("BTCUSDT");
        request.setTimeframe("5m");
        request.setStartTime("2024-01-01T00:00:00Z");
        request.setEndTime("   ");

        Instant before = Instant.now();
        Instant parsedEndTime = request.toDomainRequest().getEndTime();
        Instant after = Instant.now();

        assertTrue(!parsedEndTime.isBefore(before) && !parsedEndTime.isAfter(after));
    }

    @Test
    void shouldParseProvidedEndTime() {
        MarketDataLoadRequest request = new MarketDataLoadRequest();
        request.setSymbol("BTCUSDT");
        request.setTimeframe("5m");
        request.setStartTime("2024-01-01T00:00:00Z");
        request.setEndTime("2024-01-01T01:00:00Z");

        assertEquals(Instant.parse("2024-01-01T01:00:00Z"), request.toDomainRequest().getEndTime());
    }

    @Test
    void shouldRejectInvalidStartTime() {
        MarketDataLoadRequest request = new MarketDataLoadRequest();
        request.setSymbol("BTCUSDT");
        request.setTimeframe("5m");
        request.setStartTime("invalid");

        assertThrows(IllegalArgumentException.class, request::toDomainRequest);
    }
}