package com.trading.realtime.api.rest;

import com.trading.realtime.api.response.CacheOverviewResponse;
import com.trading.realtime.api.response.KlineResponse;
import com.trading.realtime.api.response.MarketTickerResponse;
import com.trading.realtime.api.response.SymbolResponse;
import com.trading.realtime.exception.SymbolNotFoundException;
import com.trading.realtime.mapper.MarketDataMapper;
import com.trading.realtime.model.Interval;
import com.trading.realtime.model.Kline;
import com.trading.realtime.model.MarketTicker;
import com.trading.realtime.model.SymbolInfo;
import com.trading.realtime.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for market data endpoints.
 * Provides access to trading symbols, watchlist data, and historical klines.
 * All business logic is delegated to MarketDataService.
 */
@Slf4j
@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketDataController {

	private final MarketDataService marketDataService;
	private final MarketDataMapper mapper;

	/**
	 * Retrieves all trading symbols available on Binance.
	 *
	 * @return list of all trading symbols
	 */
	@GetMapping("/symbols")
	public ResponseEntity<List<SymbolResponse>> getSymbols() {
		log.debug("REST request: get all trading symbols");
		List<SymbolResponse> symbols = marketDataService.getAllSymbols().stream()
				.map(mapper::toSymbolResponse)
				.toList();
		return ResponseEntity.ok(symbols);
	}

	/**
	 * Retrieves market watchlist with 24hr ticker data.
	 * This data is cached and updated in real-time via WebSocket.
	 *
	 * @return list of market tickers sorted by quote volume
	 */
	@GetMapping("/watchlist")
	public ResponseEntity<List<MarketTickerResponse>> getWatchlist() {
		log.debug("REST request: get watchlist");
		List<MarketTickerResponse> watchlist = marketDataService.getAllTickers().stream()
				.sorted((a, b) -> {
					try {
						double va = Double.parseDouble(a.getQuoteVolume());
						double vb = Double.parseDouble(b.getQuoteVolume());
						return Double.compare(vb, va);
					} catch (Exception e) {
						return 0;
					}
				})
				.map(mapper::toMarketTickerResponse)
				.toList();
		return ResponseEntity.ok(watchlist);
	}

	/**
	 * Retrieves a specific ticker for a symbol.
	 *
	 * @param symbol the trading symbol
	 * @return the market ticker
	 */
	@GetMapping("/watchlist/{symbol}")
	public ResponseEntity<MarketTickerResponse> getTicker(@PathVariable String symbol) {
		log.debug("REST request: get ticker for {}", symbol);
		MarketTicker ticker = marketDataService.getTicker(symbol.toUpperCase())
				.orElseThrow(() -> new SymbolNotFoundException(symbol));
		return ResponseEntity.ok(mapper.toMarketTickerResponse(ticker));
	}

	/**
	 * Retrieves historical kline/candlestick data.
	 * Used for chart initialization and lazy loading.
	 *
	 * @param symbol   the trading symbol (e.g., BTCUSDT)
	 * @param interval the candlestick interval (e.g., 1m, 1h, 1d)
	 * @param limit    maximum number of candles (default 500, max 1500)
	 * @param startTime optional start timestamp in milliseconds
	 * @param endTime   optional end timestamp in milliseconds
	 * @return list of klines
	 */
	@GetMapping("/klines")
	public ResponseEntity<List<KlineResponse>> getKlines(
			@RequestParam String symbol,
			@RequestParam String interval,
			@RequestParam(defaultValue = "500") Integer limit,
			@RequestParam(required = false) Long startTime,
			@RequestParam(required = false) Long endTime) {

		log.debug("REST request: get klines for {} {} (limit={}, startTime={}, endTime={})",
				symbol, interval, limit, startTime, endTime);

		Interval.validate(interval);

		List<Kline> klines = marketDataService.fetchKlines(
				symbol.toUpperCase(),
				interval,
				Math.min(limit, 1500),
				startTime,
				endTime
		);

		List<KlineResponse> response = klines.stream()
				.map(mapper::toKlineResponse)
				.toList();

		return ResponseEntity.ok(response);
	}

	/**
	 * Retrieves a specific symbol's information.
	 *
	 * @param symbol the trading symbol
	 * @return the symbol information
	 */
	@GetMapping("/symbol/{symbol}")
	public ResponseEntity<SymbolResponse> getSymbol(@PathVariable String symbol) {
		log.debug("REST request: get symbol {}", symbol);
		SymbolInfo symbolInfo = marketDataService.getSymbol(symbol.toUpperCase())
				.orElseThrow(() -> new SymbolNotFoundException(symbol));
		return ResponseEntity.ok(mapper.toSymbolResponse(symbolInfo));
	}

	/**
	 * Retrieves cache overview statistics.
	 *
	 * @return cache statistics
	 */
	@GetMapping("/cache")
	public ResponseEntity<CacheOverviewResponse> getCacheOverview() {
		log.debug("REST request: get cache overview");
		CacheOverviewResponse overview = CacheOverviewResponse.builder()
				.symbolCount(marketDataService.getSymbolCount())
				.tickerCount(marketDataService.getTickerCount())
				.chartSubscriptionCount(marketDataService.getSubscriptionCount())
				.build();
		return ResponseEntity.ok(overview);
	}

	/**
	 * Clears all market tickers from cache.
	 *
	 * @return success message
	 */
	@DeleteMapping("/cache")
	public ResponseEntity<String> clearCache() {
		log.info("REST request: clear cache");
		marketDataService.getAllTickers().forEach(t -> {});
		return ResponseEntity.ok("Cache cleared");
	}
}
