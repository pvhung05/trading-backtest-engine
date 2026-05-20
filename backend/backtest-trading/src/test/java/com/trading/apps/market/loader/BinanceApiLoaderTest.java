package com.trading.apps.market.loader;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.apps.market.exception.MarketDataException;
import com.trading.apps.market.model.Candle;

class BinanceApiLoaderTest {

    @Test
    void shouldLoadAndParseCandleBatch() {
        FakeRestTemplate restTemplate = new FakeRestTemplate(
                "[[1704067200000,\"100.0\",\"105.0\",\"99.0\",\"104.0\",\"1000\"]]"
        );
        BinanceApiLoader loader = new BinanceApiLoader(restTemplate, new ObjectMapper(), "https://example.test");

        List<Candle> candles = loader.loadCandles(
                "BTCUSDT",
                "5m",
                Instant.parse("2024-01-01T00:00:00Z"),
                Instant.parse("2024-01-01T00:00:00.001Z")
        );

        assertEquals(1, candles.size());
        assertEquals(100.0, candles.get(0).getOpen());
        assertEquals(105.0, candles.get(0).getHigh());
        assertEquals(99.0, candles.get(0).getLow());
        assertEquals(104.0, candles.get(0).getClose());
        assertEquals(1000, candles.get(0).getVolume());
        assertEquals(1, restTemplate.getCallCount());
    }

    @Test
    void shouldFailOnInvalidResponseFormat() {
        FakeRestTemplate restTemplate = new FakeRestTemplate("{\"message\":\"bad response\"}");
        BinanceApiLoader loader = new BinanceApiLoader(restTemplate, new ObjectMapper(), "https://example.test");

        assertThrows(MarketDataException.class, () -> loader.loadCandles(
                "BTCUSDT",
                "5m",
                Instant.parse("2024-01-01T00:00:00Z"),
                Instant.parse("2024-01-01T00:00:00.001Z")
        ));
    }

    private static final class FakeRestTemplate extends RestTemplate {

        private final String response;
        private int callCount;

        private FakeRestTemplate(String response) {
            this.response = response;
        }

        @Override
        public <T> T getForObject(String url, Class<T> responseType, Object... uriVariables) {
            callCount++;
            return responseType.cast(response);
        }

        private int getCallCount() {
            return callCount;
        }
    }
}