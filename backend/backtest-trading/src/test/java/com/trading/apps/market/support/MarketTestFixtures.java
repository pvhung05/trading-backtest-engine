package com.trading.apps.market.support;

import java.time.Instant;
import java.util.List;

import org.ta4j.core.BarSeries;

import com.trading.apps.market.mapper.CandleMapper;
import com.trading.apps.market.model.Candle;

public final class MarketTestFixtures {

    private MarketTestFixtures() {
    }

    public static List<Candle> sampleCandles() {
        return List.of(
                new Candle(Instant.parse("2024-01-01T00:00:00Z"), 100.0, 105.0, 99.0, 104.0, 1000),
                new Candle(Instant.parse("2024-01-01T00:05:00Z"), 104.0, 108.0, 103.0, 107.0, 1200),
                new Candle(Instant.parse("2024-01-01T00:10:00Z"), 107.0, 110.0, 106.0, 109.0, 1500),
                new Candle(Instant.parse("2024-01-01T00:15:00Z"), 109.0, 112.0, 108.0, 111.0, 1800),
                new Candle(Instant.parse("2024-01-01T00:20:00Z"), 111.0, 115.0, 110.0, 114.0, 2000)
        );
    }

    public static BarSeries sampleSeries() {
        return CandleMapper.toBarSeries(sampleCandles(), "BTCUSDT", "5m");
    }
}