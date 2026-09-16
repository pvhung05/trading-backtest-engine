package com.trading.realtime.service.impl;

import com.trading.realtime.cache.ChartSubscriptionCache;
import com.trading.realtime.cache.SymbolCache;
import com.trading.realtime.cache.WatchlistCache;
import com.trading.realtime.client.rest.BinanceRestClient;
import com.trading.realtime.client.rest.dto.BinanceExchangeInfoResponse;
import com.trading.realtime.client.rest.dto.BinanceTicker24hrResponse;
import com.trading.realtime.client.websocket.BinanceWebSocketListener;
import com.trading.realtime.client.websocket.BinanceWebSocketManager;
import com.trading.realtime.dto.response.RealtimeKlineEvent;
import com.trading.realtime.dto.response.RealtimeTickerEvent;
import com.trading.realtime.exception.BinanceApiException;
import com.trading.realtime.mapper.MarketDataMapper;
import com.trading.realtime.model.ChartSubscription;
import com.trading.realtime.model.Interval;
import com.trading.realtime.model.Kline;
import com.trading.realtime.model.MarketTicker;
import com.trading.realtime.model.SymbolInfo;
import com.trading.realtime.service.MarketDataService;
import com.trading.realtime.service.WebSocketBroadcastService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implementation of MarketDataService.
 * Handles data loading from Binance REST API, WebSocket streaming,
 * and provides data access through in-memory cache.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MarketDataServiceImpl implements MarketDataService, BinanceWebSocketListener {

	private final BinanceRestClient binanceRestClient;
	private final BinanceWebSocketManager webSocketManager;
	private final SymbolCache symbolCache;
	private final WatchlistCache watchlistCache;
	private final ChartSubscriptionCache chartSubscriptionCache;
	private final WebSocketBroadcastService broadcastService;
	private final MarketDataMapper mapper;

	/**
	 * Initializes the service on application startup.
	 * Loads exchange info and 24hr tickers, then starts the ticker WebSocket stream.
	 */
	@PostConstruct
	public void initialize() {
		log.info("Initializing MarketDataService...");
		try {
			loadExchangeInfo();
			load24hrTickers();
			startTickerStream();
			log.info("MarketDataService initialized successfully");
		} catch (Exception e) {
			log.error("Failed to initialize MarketDataService: {}", e.getMessage(), e);
		}
	}

	/**
	 * Gracefully disconnects all WebSocket connections on application shutdown.
	 */
	@PreDestroy
	public void shutdown() {
		log.info("Shutting down MarketDataService, closing all WebSocket connections...");
		try {
			webSocketManager.disconnectAll();
			log.info("MarketDataService shut down successfully");
		} catch (Exception e) {
			log.error("Error during MarketDataService shutdown: {}", e.getMessage(), e);
		}
	}

	/**
	 * Loads all trading symbols from Binance exchangeInfo API.
	 */
	private void loadExchangeInfo() {
		log.info("Loading exchange info from Binance...");
		BinanceExchangeInfoResponse response = binanceRestClient.getExchangeInfo();
		if (response != null && response.getSymbols() != null) {
			List<SymbolInfo> symbols = response.getSymbols().stream()
					.filter(s -> "TRADING".equalsIgnoreCase(s.getStatus()))
					.map(s -> new SymbolInfo(
							s.getSymbol(),
							s.getBaseAsset(),
							s.getQuoteAsset(),
							s.getStatus(),
							s.getTradingPermissions() != null && !s.getTradingPermissions().isEmpty()
									? s.getTradingPermissions().get(0) : "NONE",
							String.valueOf(Boolean.TRUE.equals(s.getIcebergAllowed())),
							String.valueOf(Boolean.TRUE.equals(s.getOcoAllowed()))
					))
					.toList();
			symbolCache.putAll(symbols);
			log.info("Loaded {} trading symbols", symbols.size());
		}
	}

	/**
	 * Loads 24hr ticker data for all symbols.
	 */
	private void load24hrTickers() {
		log.info("Loading 24hr tickers from Binance...");
		List<BinanceTicker24hrResponse> tickers = binanceRestClient.get24hrTickerAllSymbols();
		if (tickers != null) {
			List<MarketTicker> marketTickers = tickers.stream()
					.map(mapper::toMarketTicker)
					.toList();
			watchlistCache.updateAll(marketTickers);
			log.info("Loaded {} tickers", marketTickers.size());
		}
	}

	/**
	 * Starts the global ticker WebSocket stream.
	 */
	private void startTickerStream() {
		log.info("Starting ticker WebSocket stream...");
		webSocketManager.startTickerStream(this);
	}

	@Override
	public List<SymbolInfo> getAllSymbols() {
		return symbolCache.getTradingSymbols().stream().toList();
	}

	@Override
	public List<SymbolInfo> searchSymbols(String query) {
		return symbolCache.search(query).stream().toList();
	}

	@Override
	public List<SymbolInfo> getSymbolsByQuoteAsset(String quoteAsset) {
		return symbolCache.getByQuoteAsset(quoteAsset).stream().toList();
	}

	@Override
	public Optional<SymbolInfo> getSymbol(String symbol) {
		return symbolCache.get(symbol);
	}

	@Override
	public List<MarketTicker> getAllTickers() {
		return watchlistCache.getAll().stream().toList();
	}

	@Override
	public List<MarketTicker> getWatchlistTickers() {
		return watchlistCache.getTopByVolume().stream().toList();
	}

	@Override
	public List<MarketTicker> getTopTickers(int limit) {
		return watchlistCache.getTopByVolume().stream()
				.limit(limit > 0 ? limit : Long.MAX_VALUE)
				.toList();
	}

	@Override
	public List<MarketTicker> getTickersByQuoteAsset(String quoteAsset) {
		if (quoteAsset == null || quoteAsset.isBlank()) {
			return getWatchlistTickers();
		}
		String qa = quoteAsset.trim().toUpperCase();
		Set<String> validSymbols = symbolCache.getByQuoteAsset(qa).stream()
				.map(SymbolInfo::symbol)
				.collect(Collectors.toSet());

		return watchlistCache.getTopByVolume().stream()
				.filter(t -> validSymbols.contains(t.getSymbol()))
				.toList();
	}

	@Override
	public void clearWatchlistCache() {
		log.info("Clearing watchlist cache");
		watchlistCache.clear();
	}

	@Override
	public Optional<MarketTicker> getTicker(String symbol) {
		return watchlistCache.get(symbol);
	}

	@Override
	public List<Kline> fetchKlines(String symbol, String interval, Integer limit, Long startTime, Long endTime) {
		List<Kline> klines;
		if (startTime != null && endTime != null) {
			klines = binanceRestClient.getKlines(symbol, interval, startTime, endTime, limit)
					.stream()
					.map(mapper::toKline)
					.toList();
		} else {
			klines = binanceRestClient.getKlines(symbol, interval, limit)
					.stream()
					.map(mapper::toKline)
					.toList();
		}
		return klines;
	}

	@Override
	public ChartSubscription subscribeToChart(String symbol, String interval, String sessionId) {
		ChartSubscription subscription = chartSubscriptionCache.subscribe(symbol, interval, sessionId);

		if (subscription.getSubscriberCount() == 1) {
			webSocketManager.subscribeKline(symbol, interval, this);
			log.info("Created new kline subscription for {} {}", symbol, interval);
		}

		return subscription;
	}

	@Override
	public void unsubscribeFromChart(String symbol, String interval) {
		chartSubscriptionCache.unsubscribe(symbol, interval);
		log.debug("Decremented subscription count for {} {}", symbol, interval);
	}

	@Override
	public Optional<ChartSubscription> getChartSubscription(String symbol, String interval) {
		return chartSubscriptionCache.get(symbol, interval);
	}

	@Override
	public Optional<Kline> getLatestCandle(String symbol, String interval) {
		return chartSubscriptionCache.get(symbol, interval)
				.map(ChartSubscription::getLatestCandle);
	}

	// ============== BinanceWebSocketListener Implementation ==============

	@Override
	public void onTickerUpdate(MarketTicker ticker) {
		if (ticker == null || ticker.getSymbol() == null) {
			return;
		}
		watchlistCache.update(ticker);
		RealtimeTickerEvent event = mapper.toRealtimeTickerEvent(ticker);
		broadcastService.broadcastTickerUpdate(event);
	}

	@Override
	public void onKlineUpdate(String symbol, String interval, Kline kline) {
		if (symbol == null || interval == null || kline == null) {
			return;
		}
		chartSubscriptionCache.updateCandle(symbol, interval, kline);
		RealtimeKlineEvent event = mapper.toRealtimeKlineEvent(symbol, interval, kline);
		broadcastService.broadcastKlineUpdate(event);
	}

	@Override
	public void onConnected() {
		log.info("Connected to Binance WebSocket");
	}

	@Override
	public void onDisconnected(int code, String reason) {
		log.warn("Disconnected from Binance WebSocket - Code: {}, Reason: {}", code, reason);
	}

	@Override
	public void onReconnecting(int attemptNumber) {
		log.info("Reconnecting to Binance WebSocket - Attempt: {}", attemptNumber);
	}

	@Override
	public void onError(String error) {
		log.error("Binance WebSocket error: {}", error);
	}

	@Override
	public int getSymbolCount() {
		return symbolCache.size();
	}

	@Override
	public int getTickerCount() {
		return watchlistCache.size();
	}

	@Override
	public int getSubscriptionCount() {
		return chartSubscriptionCache.size();
	}

	@Override
	public boolean isWebSocketActive() {
		return webSocketManager.isTickerStreamActive();
	}
}
