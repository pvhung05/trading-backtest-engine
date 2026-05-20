package com.trading.apps.market.slicer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.ta4j.core.BarSeries;

import com.trading.apps.market.exception.MarketDataException;
import com.trading.apps.market.support.MarketTestFixtures;

class SeriesSlicerTest {

    @Test
    void shouldSliceSeriesByTimeRange() {
        BarSeries fullSeries = MarketTestFixtures.sampleSeries();

        BarSeries sliced = SeriesSlicer.slice(
                fullSeries,
                Instant.parse("2024-01-01T00:05:00Z"),
                Instant.parse("2024-01-01T00:15:00Z")
        );

        assertEquals(3, sliced.getBarCount());
        assertEquals("BTCUSDT", sliced.getName());
        assertEquals(Instant.parse("2024-01-01T00:05:00Z"), sliced.getBar(0).getEndTime());
        assertEquals(Instant.parse("2024-01-01T00:15:00Z"), sliced.getBar(2).getEndTime());
    }

    @Test
    void shouldRejectInvalidRange() {
        BarSeries fullSeries = MarketTestFixtures.sampleSeries();

        assertThrows(IllegalArgumentException.class, () -> SeriesSlicer.slice(
                fullSeries,
                Instant.parse("2024-01-01T00:15:00Z"),
                Instant.parse("2024-01-01T00:05:00Z")
        ));
    }

    @Test
    void shouldRejectRangeWithoutBars() {
        BarSeries fullSeries = MarketTestFixtures.sampleSeries();

        assertThrows(MarketDataException.class, () -> SeriesSlicer.slice(
                fullSeries,
                Instant.parse("2024-02-01T00:00:00Z"),
                Instant.parse("2024-02-01T01:00:00Z")
        ));
    }
}