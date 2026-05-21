package com.trading.apps.api.controller.market;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.ta4j.core.BarSeries;

import com.trading.apps.api.mapper.market.MarketCacheResponseMapper;
import com.trading.apps.api.mapper.market.MarketDataResponseMapper;
import com.trading.apps.api.request.market.MarketDataLoadRequest;
import com.trading.apps.api.response.market.MarketCacheResponse;
import com.trading.apps.api.response.market.MarketDataResponse;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.service.MarketDataService;

/**
 * REST controller for market-data endpoints.
 */
@RestController
@RequestMapping("/api/market")
public class MarketDataController {

    private final MarketDataService marketDataService;
    private final MarketDataResponseMapper marketDataResponseMapper;
    private final MarketCacheResponseMapper marketCacheResponseMapper;

    public MarketDataController(MarketDataService marketDataService,
            MarketDataResponseMapper marketDataResponseMapper,
            MarketCacheResponseMapper marketCacheResponseMapper) {
        this.marketDataService = marketDataService;
        this.marketDataResponseMapper = marketDataResponseMapper;
        this.marketCacheResponseMapper = marketCacheResponseMapper;
    }

    @GetMapping("/load")
    public ResponseEntity<MarketDataResponse> loadMarketData(@ModelAttribute MarketDataLoadRequest apiRequest) {
        MarketDataRequest request = apiRequest.toDomainRequest();
        BarSeries series = marketDataService.load(request);
        MarketDataResponse response = marketDataResponseMapper.toResponse(request, series);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cache")
    public ResponseEntity<MarketCacheResponse> getCacheOverview() {
        return ResponseEntity.ok(marketCacheResponseMapper.toResponse(marketDataService.getCacheSnapshots()));
    }

    @DeleteMapping("/cache")
    public ResponseEntity<Void> clearCache() {
        marketDataService.clearCache();
        return ResponseEntity.noContent().build();
    }

    // Per-entry removal endpoint removed — only full-cache clear is supported now.
}
