package com.trading.apps.market.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.ta4j.core.BarSeries;

import com.trading.apps.market.cache.MarketDataCache;
import com.trading.apps.market.mapper.CandleMapper;
import com.trading.apps.market.model.Candle;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.provider.MarketDataProvider;
import com.trading.apps.market.support.MarketTestFixtures;

class MarketDataServiceTest {

    @Test
    void shouldLoadSliceAndReuseCache() {
        MarketDataCache cache = new MarketDataCache();
        CountingProvider provider = new CountingProvider();
        MarketDataService service = new MarketDataService(cache, provider);

        MarketDataRequest firstRequest = new MarketDataRequest(
                "BTCUSDT",
                "5m",
                Instant.parse("2024-01-01T00:05:00Z"),
                Instant.parse("2024-01-01T00:15:00Z")
        );

        BarSeries firstSeries = service.load(firstRequest);

        assertEquals(1, provider.callCount.get());
        assertEquals(1, cache.size());
        assertEquals(3, firstSeries.getBarCount());

        MarketDataRequest secondRequest = new MarketDataRequest(
                "BTCUSDT",
                "5m",
                Instant.parse("2024-01-01T00:10:00Z"),
                Instant.parse("2024-01-01T00:20:00Z")
        );

        BarSeries secondSeries = service.load(secondRequest);

        assertEquals(1, provider.callCount.get());
        assertEquals(1, cache.size());
        assertEquals(3, secondSeries.getBarCount());
        assertSame(cache.get("BTCUSDT-5m").orElseThrow(), provider.cachedSeries);
    }

    @Test
    void shouldClearCache() {
        MarketDataCache cache = new MarketDataCache();
        CountingProvider provider = new CountingProvider();
        MarketDataService service = new MarketDataService(cache, provider);

        service.load(new MarketDataRequest(
                "BTCUSDT",
                "5m",
                Instant.parse("2024-01-01T00:05:00Z"),
                Instant.parse("2024-01-01T00:15:00Z")
        ));

        assertEquals(1, service.getCacheSize());

        service.clearCache();

        assertEquals(0, service.getCacheSize());
    }

    @Test
    void shouldExtendCachedSeriesWhenRequestExceedsCachedEnd() {
        MarketDataCache cache = new MarketDataCache();
        BarSeries cachedSeries = seriesOf(
                "BTCUSDT",
                "5m",
                Instant.parse("2022-01-01T00:00:00Z"),
                Instant.parse("2023-01-01T00:00:00Z"),
                Instant.parse("2024-01-01T00:00:00Z")
        );
        cache.put("BTCUSDT-5m", cachedSeries);

        BarSeries extensionSeries = seriesOf(
                "BTCUSDT",
                "5m",
                Instant.parse("2025-01-01T00:00:00Z"),
                Instant.parse("2025-06-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z")
        );

        ExtendingProvider provider = new ExtendingProvider(extensionSeries);
        MarketDataService service = new MarketDataService(cache, provider);

        MarketDataRequest request = new MarketDataRequest(
                "BTCUSDT",
                "5m",
                Instant.parse("2025-01-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z")
        );

        BarSeries result = service.load(request);

        assertEquals(1, provider.callCount.get());
        assertNotNull(provider.lastRequest);
        assertEquals(Instant.parse("2024-01-01T00:00:00.001Z"), provider.lastRequest.getStartTime());
        assertEquals(Instant.parse("2026-01-01T00:00:00Z"), provider.lastRequest.getEndTime());
        assertEquals(6, cache.get("BTCUSDT-5m").orElseThrow().getBarCount());
        assertEquals(3, result.getBarCount());
        assertEquals(Instant.parse("2026-01-01T00:00:00Z"),
                cache.get("BTCUSDT-5m").orElseThrow().getBar(5).getEndTime());
    }

    @Test
    void shouldExtendCachedSeriesWhenRequestStartsBeforeCachedBegin() {
        MarketDataCache cache = new MarketDataCache();
        BarSeries cachedSeries = seriesOf(
                "BTCUSDT",
                "5m",
                Instant.parse("2022-01-01T00:00:00Z"),
                Instant.parse("2023-01-01T00:00:00Z"),
                Instant.parse("2024-01-01T00:00:00Z")
        );
        cache.put("BTCUSDT-5m", cachedSeries);

        BarSeries backfillSeries = seriesOf(
                "BTCUSDT",
                "5m",
                Instant.parse("2020-01-01T00:00:00Z"),
                Instant.parse("2021-01-01T00:00:00Z")
        );

        ExtendingProvider provider = new ExtendingProvider(backfillSeries);
        MarketDataService service = new MarketDataService(cache, provider);

        MarketDataRequest request = new MarketDataRequest(
                "BTCUSDT",
                "5m",
                Instant.parse("2020-01-01T00:00:00Z"),
                Instant.parse("2024-01-01T00:00:00Z")
        );

        BarSeries result = service.load(request);

        assertEquals(1, provider.callCount.get());
        assertNotNull(provider.lastRequest);
        assertEquals(Instant.parse("2020-01-01T00:00:00Z"), provider.lastRequest.getStartTime());
        assertEquals(Instant.parse("2021-12-31T23:59:59.999Z"), provider.lastRequest.getEndTime());
        assertEquals(5, cache.get("BTCUSDT-5m").orElseThrow().getBarCount());
        assertEquals(5, result.getBarCount());
        assertEquals(Instant.parse("2020-01-01T00:00:00Z"),
                cache.get("BTCUSDT-5m").orElseThrow().getBar(0).getEndTime());
    }

    @Test
    void shouldRejectNullRequest() {
        MarketDataService service = new MarketDataService(new MarketDataCache(), new CountingProvider());

        assertThrows(NullPointerException.class, () -> service.load(null));
    }

    private static final class CountingProvider implements MarketDataProvider {

        private final AtomicInteger callCount = new AtomicInteger();
        private BarSeries cachedSeries;

        @Override
        public BarSeries provide(MarketDataRequest request) {
            callCount.incrementAndGet();
            cachedSeries = MarketTestFixtures.sampleSeries();
            return cachedSeries;
        }
    }

    private static final class ExtendingProvider implements MarketDataProvider {

        private final AtomicInteger callCount = new AtomicInteger();
        private final BarSeries seriesToReturn;
        private MarketDataRequest lastRequest;

        private ExtendingProvider(BarSeries seriesToReturn) {
            this.seriesToReturn = seriesToReturn;
        }

        @Override
        public BarSeries provide(MarketDataRequest request) {
            callCount.incrementAndGet();
            lastRequest = request;
            return seriesToReturn;
        }
    }

    private static BarSeries seriesOf(String symbol, String timeframe, Instant... times) {
        List<Candle> candles = Arrays.stream(times)
                .map(time -> new Candle(time, 100.0, 110.0, 90.0, 105.0, 1_000L))
                .toList();

        return CandleMapper.toBarSeries(candles, symbol, timeframe);
    }
}