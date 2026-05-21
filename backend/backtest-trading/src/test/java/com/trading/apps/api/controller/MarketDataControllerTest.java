package com.trading.apps.api.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.ta4j.core.BarSeries;

import com.trading.apps.api.controller.market.MarketDataController;
import com.trading.apps.api.mapper.market.MarketCacheResponseMapper;
import com.trading.apps.api.mapper.market.MarketDataResponseMapper;
import com.trading.apps.api.request.market.MarketDataLoadRequest;
import com.trading.apps.api.response.market.MarketCacheResponse;
import com.trading.apps.api.response.market.MarketDataResponse;
import com.trading.apps.market.cache.MarketDataCache;
import com.trading.apps.market.mapper.CandleMapper;
import com.trading.apps.market.model.Candle;
import com.trading.apps.market.model.MarketDataCacheSnapshot;
import com.trading.apps.market.provider.MarketDataProvider;
import com.trading.apps.market.service.MarketDataService;

class MarketDataControllerTest {

    @Test
    void shouldReturnMarketDataAsJson() throws Exception {
        MarketDataProvider provider = request -> CandleMapper.toBarSeries(List.of(
                new Candle(Instant.parse("2024-01-01T00:00:00Z"), 100.0, 110.0, 95.0, 105.0, 1000),
                new Candle(Instant.parse("2024-01-01T00:05:00Z"), 105.0, 112.0, 102.0, 110.0, 1200)
        ), "BTCUSDT", "5m");

        MarketDataService marketDataService = new MarketDataService(new MarketDataCache(), provider);
        MarketDataController controller = new MarketDataController(
            marketDataService,
            new MarketDataResponseMapper(),
            new MarketCacheResponseMapper());

        MarketDataLoadRequest apiRequest = new MarketDataLoadRequest();
        apiRequest.setSymbol("BTCUSDT");
        apiRequest.setTimeframe("5m");
        apiRequest.setStartTime("2024-01-01T00:00:00Z");
        apiRequest.setEndTime("2024-01-01T00:10:00Z");

        ResponseEntity<MarketDataResponse> response = controller.loadMarketData(apiRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("BTCUSDT", response.getBody().symbol());
        assertEquals("5m", response.getBody().timeframe());
        assertEquals(2, response.getBody().barCount());
        assertEquals("2024-01-01T00:00:00Z", response.getBody().bars().get(0).endTime());
    }

    @Test
    void shouldThrowWhenInputInvalid() {
        MarketDataProvider provider = request -> CandleMapper.toBarSeries(List.of(), "BTCUSDT", "5m");
        MarketDataService marketDataService = new MarketDataService(new MarketDataCache(), provider);
        MarketDataController controller = new MarketDataController(
            marketDataService,
            new MarketDataResponseMapper(),
            new MarketCacheResponseMapper());

        MarketDataLoadRequest apiRequest = new MarketDataLoadRequest();
        apiRequest.setSymbol("BTCUSDT");
        apiRequest.setTimeframe("5m");
        apiRequest.setStartTime("invalid-time");
        apiRequest.setEndTime("2024-01-01T00:10:00Z");

        assertThrows(IllegalArgumentException.class, () -> controller.loadMarketData(apiRequest));
    }

    @Test
    void shouldReturnCacheOverview() {
        MarketDataCache cache = new MarketDataCache();
        BarSeries series = CandleMapper.toBarSeries(List.of(
                new Candle(Instant.parse("2024-01-01T00:00:00Z"), 100.0, 110.0, 95.0, 105.0, 1000),
                new Candle(Instant.parse("2024-01-01T00:05:00Z"), 105.0, 112.0, 102.0, 110.0, 1200)
        ), "BTCUSDT", "5m");
        cache.put("BTCUSDT-5m", series);

        MarketDataService marketDataService = new MarketDataService(cache, request -> series);
        MarketDataController controller = new MarketDataController(
                marketDataService,
                new MarketDataResponseMapper(),
                new MarketCacheResponseMapper());

        ResponseEntity<MarketCacheResponse> response = controller.getCacheOverview();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().cacheSize());
        assertEquals(1, response.getBody().entries().size());
        assertEquals("BTCUSDT", response.getBody().entries().get(0).symbol());
        assertEquals("5m", response.getBody().entries().get(0).timeframe());
        assertEquals("2024-01-01T00:00:00Z", response.getBody().entries().get(0).startTime());
        assertEquals("2024-01-01T00:05:00Z", response.getBody().entries().get(0).endTime());
        assertEquals(2, response.getBody().entries().get(0).barCount());
    }

        

        @Test
        void shouldClearEntireCache() {
        MarketDataCache cache = new MarketDataCache();
        BarSeries series = CandleMapper.toBarSeries(List.of(
            new Candle(Instant.parse("2024-01-01T00:00:00Z"), 100.0, 110.0, 95.0, 105.0, 1000)
        ), "BTCUSDT", "5m");
        cache.put("BTCUSDT-5m", series);

        MarketDataService marketDataService = new MarketDataService(cache, request -> series);
        MarketDataController controller = new MarketDataController(
            marketDataService,
            new MarketDataResponseMapper(),
            new MarketCacheResponseMapper());

        ResponseEntity<Void> response = controller.clearCache();
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        assertEquals(0, marketDataService.getCacheSize());
        }
}
