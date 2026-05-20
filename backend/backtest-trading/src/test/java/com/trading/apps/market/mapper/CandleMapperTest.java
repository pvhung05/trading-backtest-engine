package com.trading.apps.market.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.ta4j.core.BarSeries;

import com.trading.apps.market.support.MarketTestFixtures;

class CandleMapperTest {

    @Test
    void shouldMapCandlesToBarSeries() {
        BarSeries series = CandleMapper.toBarSeries(MarketTestFixtures.sampleCandles(), "btcusdt", "5m");

        assertNotNull(series);
        assertEquals("BTCUSDT", series.getName());
        assertEquals(5, series.getBarCount());
        assertEquals(100.0, series.getBar(0).getOpenPrice().doubleValue());
        assertEquals(114.0, series.getBar(4).getClosePrice().doubleValue());
    }
}