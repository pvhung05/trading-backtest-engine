package com.trading.realtime.service;

import com.trading.realtime.api.response.RealtimeKlineEvent;
import com.trading.realtime.api.response.RealtimeTickerEvent;
import com.trading.realtime.cache.ChartSubscriptionCache;
import com.trading.realtime.cache.SymbolCache;
import com.trading.realtime.cache.WatchlistCache;
import com.trading.realtime.client.rest.BinanceRestClient;
import com.trading.realtime.client.rest.dto.BinanceExchangeInfoResponse;
import com.trading.realtime.client.rest.dto.BinanceTicker24hrResponse;
import com.trading.realtime.client.websocket.BinanceWebSocketListener;
import com.trading.realtime.client.websocket.BinanceWebSocketManager;
import com.trading.realtime.exception.BinanceApiException;
import com.trading.realtime.mapper.MarketDataMapper;
import com.trading.realtime.model.ChartSubscription;
import com.trading.realtime.model.Interval;
import com.trading.realtime.model.Kline;
import com.trading.realtime.model.MarketTicker;
import com.trading.realtime.model.SymbolInfo;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Core service for managing market data operations.
 * Handles data loading from Binance REST API, WebSocket streaming,
 * and provides data access through cache.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MarketDataService implements BinanceWebSocketListener {

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

	/**
	 * Retrieves all trading symbols.
	 *
	 * @return list of symbol information
	 */
	public List<SymbolInfo> getAllSymbols() {
		return symbolCache.getTradingSymbols().stream().toList();
	}

	/**
	 * Retrieves symbol information by symbol name.
	 *
	 * @param symbol the symbol name
	 * @return Optional containing symbol info if found
	 */
	public Optional<SymbolInfo> getSymbol(String symbol) {
		return symbolCache.get(symbol);
	}

	/**
	 * Retrieves all market tickers.
	 *
	 * @return list of market tickers
	 */
	public List<MarketTicker> getAllTickers() {
		return watchlistCache.getAll().stream().toList();
	}

	/**
	 * Retrieves a ticker for a specific symbol.
	 *
	 * @param symbol the symbol name
	 * @return Optional containing ticker if found
	 */
	public Optional<MarketTicker> getTicker(String symbol) {
		return watchlistCache.get(symbol);
	}

	/**
	 * Fetches historical kline data from Binance REST API.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @param limit    maximum number of candles
	 * @param startTime optional start time in milliseconds
	 * @param endTime   optional end time in milliseconds
	 * @return list of klines
	 * @throws BinanceApiException if the API call fails
	 */
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

	/**
	 * Subscribes to real-time chart updates for a symbol and interval.
	 * Creates the WebSocket subscription if not already active.
	 *
	 * @param symbol     the trading symbol
	 * @param interval   the candlestick interval
	 * @param sessionId  the frontend WebSocket session ID
	 * @return the chart subscription
	 */
	public ChartSubscription subscribeToChart(String symbol, String interval, String sessionId) {
		ChartSubscription subscription = chartSubscriptionCache.subscribe(symbol, interval, sessionId);

		if (subscription.getSubscriberCount() == 1) {
			String wsStream = Interval.toWebSocketStream(symbol, interval);
			webSocketManager.subscribeKline(symbol, interval, this);
			log.info("Created new kline subscription for {} {}", symbol, interval);
		}

		return subscription;
	}

	/**
	 * Unsubscribes from real-time chart updates.
	 * Decrements the subscriber count but doesn't close the WebSocket immediately.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 */
	public void unsubscribeFromChart(String symbol, String interval) {
		chartSubscriptionCache.unsubscribe(symbol, interval);
		log.debug("Decremented subscription count for {} {}", symbol, interval);
	}

	/**
	 * Retrieves the current chart subscription state.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @return Optional containing the subscription if exists
	 */
	public Optional<ChartSubscription> getChartSubscription(String symbol, String interval) {
		return chartSubscriptionCache.get(symbol, interval);
	}

	/**
	 * Returns the latest candle for a chart subscription.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @return Optional containing the latest candle
	 */
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

	/**
	 * Returns the count of cached symbols.
	 */
	public int getSymbolCount() {
		return symbolCache.size();
	}

	/**
	 * Returns the count of cached tickers.
	 */
	public int getTickerCount() {
		return watchlistCache.size();
	}

	/**
	 * Returns the count of active chart subscriptions.
	 */
	public int getSubscriptionCount() {
		return chartSubscriptionCache.size();
	}
}
