package com.trading.realtime.controller;

import com.trading.realtime.dto.response.CacheOverviewResponse;
import com.trading.realtime.dto.response.KlineResponse;
import com.trading.realtime.dto.response.MarketTickerResponse;
import com.trading.realtime.dto.response.SymbolResponse;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
	 * Searches trading symbols matching query against symbol name, base asset, or quote asset.
	 *
	 * @param q keyword to search (e.g. BTC, ETH, USDT)
	 * @return list of matching symbols
	 */
	@GetMapping("/symbols/search")
	public ResponseEntity<List<SymbolResponse>> searchSymbols(@RequestParam String q) {
		log.debug("REST request: search symbols with query '{}'", q);
		List<SymbolResponse> symbols = marketDataService.searchSymbols(q).stream()
				.map(mapper::toSymbolResponse)
				.toList();
		return ResponseEntity.ok(symbols);
	}

	/**
	 * Retrieves market watchlist with 24hr ticker data.
	 * This data is cached and updated in real-time via WebSocket.
	 * Sorted by quote volume descending.
	 *
	 * @param limit optional limit on the number of tickers returned
	 * @return list of market tickers sorted by quote volume
	 */
	@GetMapping("/watchlist")
	public ResponseEntity<List<MarketTickerResponse>> getWatchlist(
			@RequestParam(required = false) Integer limit) {
		log.debug("REST request: get watchlist (limit={})", limit);
		List<MarketTicker> tickers = (limit != null && limit > 0)
				? marketDataService.getTopTickers(limit)
				: marketDataService.getWatchlistTickers();
		List<MarketTickerResponse> watchlist = tickers.stream()
				.map(mapper::toMarketTickerResponse)
				.toList();
		return ResponseEntity.ok(watchlist);
	}

	/**
	 * Retrieves market watchlist filtered by quote asset (e.g. USDT, BTC).
	 *
	 * @param quoteAsset quote asset to filter by
	 * @return list of filtered market tickers sorted by quote volume
	 */
	@GetMapping("/watchlist/filter")
	public ResponseEntity<List<MarketTickerResponse>> filterWatchlist(
			@RequestParam String quoteAsset) {
		log.debug("REST request: filter watchlist by quote asset '{}'", quoteAsset);
		List<MarketTickerResponse> filtered = marketDataService.getTickersByQuoteAsset(quoteAsset).stream()
				.map(mapper::toMarketTickerResponse)
				.toList();
		return ResponseEntity.ok(filtered);
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
		marketDataService.clearWatchlistCache();
		return ResponseEntity.ok("Cache cleared");
	}

	/**
	 * Health check endpoint for realtime-market service.
	 *
	 * @return service health and connection status
	 */
	@GetMapping("/health")
	public ResponseEntity<Map<String, Object>> getHealth() {
		log.debug("REST request: health check");
		Map<String, Object> health = new HashMap<>();
		health.put("status", "UP");
		health.put("service", "realtime-market");
		health.put("wsConnected", marketDataService.isWebSocketActive());
		health.put("cachedSymbols", marketDataService.getSymbolCount());
		health.put("cachedTickers", marketDataService.getTickerCount());
		health.put("activeSubscriptions", marketDataService.getSubscriptionCount());
		return ResponseEntity.ok(health);
	}
}
