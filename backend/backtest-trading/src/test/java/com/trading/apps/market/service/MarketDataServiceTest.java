package com.trading.apps.market.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.ta4j.core.BarSeries;

import com.trading.apps.market.cache.MarketDataCache;
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
}