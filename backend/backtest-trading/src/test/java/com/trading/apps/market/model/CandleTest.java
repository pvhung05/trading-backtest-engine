package com.trading.apps.market.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class CandleTest {

    @Test
    void shouldExposeAllFields() {
        Instant openTime = Instant.parse("2024-01-01T00:00:00Z");
        Candle candle = new Candle(openTime, 100.0, 110.0, 95.0, 105.0, 1234);

        assertEquals(openTime, candle.getOpenTime());
        assertEquals(100.0, candle.getOpen());
        assertEquals(110.0, candle.getHigh());
        assertEquals(95.0, candle.getLow());
        assertEquals(105.0, candle.getClose());
        assertEquals(1234, candle.getVolume());
        assertNotNull(candle.toString());
    }

    @Test
    void shouldImplementValueEquality() {
        Instant openTime = Instant.parse("2024-01-01T00:00:00Z");
        Candle candle1 = new Candle(openTime, 100.0, 110.0, 95.0, 105.0, 1234);
        Candle candle2 = new Candle(openTime, 100.0, 110.0, 95.0, 105.0, 1234);
        Candle candle3 = new Candle(openTime, 101.0, 110.0, 95.0, 105.0, 1234);

        assertEquals(candle1, candle2);
        assertEquals(candle1.hashCode(), candle2.hashCode());
        assertNotEquals(candle1, candle3);
    }

    @Test
    void shouldRejectNullOpenTime() {
        assertThrows(NullPointerException.class,
                () -> new Candle(null, 100.0, 110.0, 95.0, 105.0, 1234));
    }
}