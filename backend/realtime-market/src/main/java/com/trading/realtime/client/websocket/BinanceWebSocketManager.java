package com.trading.realtime.client.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trading.realtime.client.websocket.dto.BinanceCombinedStreamMessage;
import com.trading.realtime.client.websocket.dto.BinanceKlineStreamMessage;
import com.trading.realtime.client.websocket.dto.BinanceTickerStreamMessage;
import com.trading.realtime.client.websocket.dto.BinanceWebSocketMessage;
import com.trading.realtime.model.Interval;
import com.trading.realtime.model.Kline;
import com.trading.realtime.model.MarketTicker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketClient;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Manages the lifecycle of Binance WebSocket connections.
 * Implements a singleton pattern for the ticker stream (only one !ticker@arr connection).
 * Manages multiple kline streams (one per unique symbol+interval combination).
 * Handles automatic reconnection on connection loss.
 */
@Slf4j
@Component
public class BinanceWebSocketManager {

	private final WebSocketClient webSocketClient;
	private final ObjectMapper objectMapper;
	private final TaskScheduler taskScheduler;

	@Value("${binance.ws.base-url}")
	private String wsBaseUrl;

	@Value("${binance.ws.ticker-stream}")
	private String tickerStream;

	@Value("${binance.ws.reconnect-delay-ms}")
	private long reconnectDelayMs;

	@Value("${binance.ws.max-reconnect-attempts}")
	private int maxReconnectAttempts;

	@Value("${binance.ws.heartbeat-interval-ms}")
	private long heartbeatIntervalMs;

	@Value("${binance.ws.idle-timeout-ms}")
	private long idleTimeoutMs;

	private final Map<String, WebSocketSession> tickerSession = new ConcurrentHashMap<>();
	private final Map<String, WebSocketSession> klineSessions = new ConcurrentHashMap<>();
	private final Map<String, Set<BinanceWebSocketListener>> listeners = new ConcurrentHashMap<>();
	private final AtomicInteger reconnectAttempt = new AtomicInteger(0);
	private volatile boolean isTickerStreamActive = false;

	public BinanceWebSocketManager(ObjectMapper objectMapper) {
		this.webSocketClient = new StandardWebSocketClient();
		this.objectMapper = objectMapper;
		this.taskScheduler = buildTaskScheduler();
		log.info("Binance WebSocket Manager initialized");
	}

	private static TaskScheduler buildTaskScheduler() {
		ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
		scheduler.setPoolSize(4);
		scheduler.setThreadNamePrefix("binance-ws-reconnect-");
		scheduler.initialize();
		return scheduler;
	}

	public synchronized void startTickerStream(BinanceWebSocketListener listener) {
		String streamKey = "!ticker@arr";
		if (isTickerStreamActive && !tickerSession.isEmpty() && tickerSession.values().stream().anyMatch(WebSocketSession::isOpen)) {
			registerListener(streamKey, listener);
			log.debug("Ticker stream already active, registered additional listener");
			return;
		}

		String url = wsBaseUrl + "/" + tickerStream;
		log.info("Starting ticker stream: {}", url);
		connect(url, streamKey, listener);
		isTickerStreamActive = true;
	}

	public void subscribeKline(String symbol, String interval, BinanceWebSocketListener listener) {
		String streamKey = buildStreamKey(symbol, interval);
		String stream = Interval.toWebSocketStream(symbol, interval);

		if (listeners.containsKey(streamKey)) {
			registerListener(streamKey, listener);
			log.debug("Kline stream {} already subscribed, registered additional listener", stream);
			return;
		}

		String url = wsBaseUrl + "/" + stream;
		log.info("Starting kline stream: {}", url);
		registerListener(streamKey, listener);
		connect(url, streamKey, listener);
	}

	public void unsubscribeKline(String symbol, String interval, BinanceWebSocketListener listener) {
		String streamKey = buildStreamKey(symbol, interval);
		removeListener(streamKey, listener);

		Set<BinanceWebSocketListener> listenerSet = listeners.get(streamKey);
		if (listenerSet == null || listenerSet.isEmpty()) {
			listeners.remove(streamKey);
			WebSocketSession session = klineSessions.remove(streamKey);
			if (session != null && session.isOpen()) {
				sendUnsubscription(session, Interval.toWebSocketStream(symbol, interval));
				closeSession(session);
			}
			log.info("Unsubscribed from kline stream: {}", streamKey);
		}
	}

	public synchronized void disconnectAll() {
		log.info("Disconnecting all WebSocket connections");
		isTickerStreamActive = false;

		tickerSession.values().forEach(this::closeSession);
		tickerSession.clear();
		klineSessions.values().forEach(this::closeSession);
		klineSessions.clear();
		listeners.clear();
		reconnectAttempt.set(0);
	}

	private void connect(String url, String streamKey, BinanceWebSocketListener listener) {
		try {
			WebSocketHandler handler = createHandler(streamKey);
			registerListener(streamKey, listener);

			webSocketClient.execute(handler, URI.create(url).toString()).whenComplete((session, ex) -> {
				if (ex != null) {
					log.error("WebSocket connection failed for {}: {}", streamKey, ex.getMessage());
					broadcastToStreamListeners(streamKey, l -> l.onError(ex.getMessage()));
					scheduleReconnect(url, streamKey);
				}
			});
		} catch (Exception e) {
			log.error("Failed to initiate WebSocket connection for {}: {}", streamKey, e.getMessage(), e);
			scheduleReconnect(url, streamKey);
		}
	}

	private WebSocketHandler createHandler(String streamKey) {
		return new TextWebSocketHandler() {
			@Override
			public void afterConnectionEstablished(WebSocketSession session) {
				log.info("WebSocket connected: {} - Session ID: {}", streamKey, session.getId());
				reconnectAttempt.set(0);
				if ("!ticker@arr".equals(streamKey)) {
					tickerSession.put(streamKey, session);
					isTickerStreamActive = true;
				} else {
					klineSessions.put(streamKey, session);
				}
				broadcastToStreamListeners(streamKey, BinanceWebSocketListener::onConnected);
			}

			@Override
			protected void handleTextMessage(WebSocketSession session, TextMessage message) {
				try {
					processMessage(session, message.getPayload(), streamKey);
				} catch (Exception e) {
					log.error("Error processing WebSocket message for {}: {}", streamKey, e.getMessage(), e);
				}
			}

			@Override
			public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
				log.info("WebSocket closed: {} - Status: {} - Reason: {}", streamKey, status.getCode(), status);
				if ("!ticker@arr".equals(streamKey)) {
					tickerSession.remove(streamKey, session);
					if (tickerSession.isEmpty()) {
						isTickerStreamActive = false;
					}
				} else {
					klineSessions.remove(streamKey, session);
				}
				broadcastToStreamListeners(streamKey, l -> l.onDisconnected(status.getCode(), String.valueOf(status)));
				scheduleReconnect(session.getUri().toString(), streamKey);
			}

			@Override
			public void handleTransportError(WebSocketSession session, Throwable exception) {
				log.error("WebSocket transport error for {}: {}", streamKey, exception.getMessage());
				broadcastToStreamListeners(streamKey, l -> l.onError(exception.getMessage()));
				if (session.isOpen()) {
					try {
						session.close(CloseStatus.SERVER_ERROR);
					} catch (IOException e) {
						log.error("Error closing session for {}: {}", streamKey, e.getMessage());
					}
				}
			}
		};
	}

	private void processMessage(WebSocketSession session, String payload, String streamKey) {
		if (payload == null || payload.isEmpty()) {
			return;
		}

		if (payload.startsWith("{")) {
			if (payload.contains("\"e\":\"24hrTicker\"") || payload.contains("\"stream\":\"!ticker@arr\"")) {
				processTickerMessage(payload);
			} else if (payload.contains("\"e\":\"kline\"")) {
				processKlineMessage(payload);
			}
		} else if (payload.startsWith("[")) {
			try {
				objectMapper.readValue(payload, List.class).forEach(item -> {
					try {
						String itemStr = objectMapper.writeValueAsString(item);
						if (itemStr.contains("\"e\":\"24hrTicker\"")) {
							processTickerMessage(itemStr);
						}
					} catch (Exception e) {
						log.debug("Error processing array item for {}: {}", streamKey, e.getMessage());
					}
				});
			} catch (Exception e) {
				log.debug("Error parsing array payload for {}: {}", streamKey, e.getMessage());
			}
		}
	}

	private void processTickerMessage(String payload) {
		try {
			BinanceTickerStreamMessage tickerMsg;
			if (payload.startsWith("{")) {
				if (payload.startsWith("{\"stream\":")) {
					BinanceCombinedStreamMessage<BinanceTickerStreamMessage> combined =
							objectMapper.readValue(payload,
									objectMapper.getTypeFactory().constructParametricType(
											BinanceCombinedStreamMessage.class, BinanceTickerStreamMessage.class));
					tickerMsg = combined.getData();
				} else {
					tickerMsg = objectMapper.readValue(payload, BinanceTickerStreamMessage.class);
				}
			} else {
				return;
			}

			MarketTicker ticker = MarketTicker.builder()
					.symbol(tickerMsg.getSymbol())
					.lastPrice(tickerMsg.getLastPrice())
					.priceChange(tickerMsg.getPriceChange())
					.priceChangePercent(tickerMsg.getPriceChangePercent())
					.highPrice(tickerMsg.getHighPrice())
					.lowPrice(tickerMsg.getLowPrice())
					.volume(tickerMsg.getVolume())
					.quoteVolume(tickerMsg.getQuoteVolume())
					.openTime(tickerMsg.getOpenTime())
					.closeTime(tickerMsg.getCloseTime())
					.count(tickerMsg.getTotalTrades())
					.build();

			broadcastToStreamListeners("!ticker@arr", l -> l.onTickerUpdate(ticker));
		} catch (Exception e) {
			log.error("Error parsing ticker message: {}", e.getMessage());
		}
	}

	private void processKlineMessage(String payload) {
		try {
			BinanceKlineStreamMessage klineMsg;
			if (payload.startsWith("{\"stream\":")) {
				BinanceCombinedStreamMessage<BinanceKlineStreamMessage> combined =
						objectMapper.readValue(payload,
								objectMapper.getTypeFactory().constructParametricType(
										BinanceCombinedStreamMessage.class, BinanceKlineStreamMessage.class));
				klineMsg = combined.getData();
			} else {
				klineMsg = objectMapper.readValue(payload, BinanceKlineStreamMessage.class);
			}

			if (klineMsg == null || klineMsg.getK() == null) {
				return;
			}

			BinanceKlineStreamMessage.KlineData k = klineMsg.getK();
			Kline kline = Kline.builder()
					.openTime(k.getOpenTime())
					.open(k.getOpen())
					.high(k.getHigh())
					.low(k.getLow())
					.close(k.getClose())
					.volume(k.getVolume())
					.closeTime(k.getCloseTime())
					.quoteVolume(k.getQuoteVolume())
					.trades(k.getNumberOfTrades())
					.takerBuyBaseVolume(k.getTakerBuyBaseVolume())
					.takerBuyQuoteVolume(k.getTakerBuyQuoteVolume())
					.build();

			String interval = k.getInterval();
			String symbol = klineMsg.getSymbol();
			String streamKey = buildStreamKey(symbol, interval);

			broadcastToStreamListeners(streamKey, l -> l.onKlineUpdate(symbol, interval, kline));
		} catch (Exception e) {
			log.error("Error parsing kline message: {}", e.getMessage());
		}
	}

	private void sendSubscription(WebSocketSession session, String stream) {
		try {
			if (session.isOpen()) {
				BinanceWebSocketMessage msg = BinanceWebSocketMessage.subscribe(stream);
				session.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
				log.debug("Sent SUBSCRIBE for stream: {}", stream);
			}
		} catch (Exception e) {
			log.error("Failed to send SUBSCRIBE message: {}", e.getMessage());
		}
	}

	private void sendUnsubscription(WebSocketSession session, String stream) {
		try {
			if (session.isOpen()) {
				BinanceWebSocketMessage msg = BinanceWebSocketMessage.unsubscribe(stream);
				session.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
				log.debug("Sent UNSUBSCRIBE for stream: {}", stream);
			}
		} catch (Exception e) {
			log.error("Failed to send UNSUBSCRIBE message: {}", e.getMessage());
		}
	}

	private void scheduleReconnect(String url, String streamKey) {
		int attempt = reconnectAttempt.incrementAndGet();
		if (attempt > maxReconnectAttempts) {
			log.error("Max reconnection attempts ({}) reached for stream: {}", maxReconnectAttempts, streamKey);
			broadcastToStreamListeners(streamKey, l -> l.onError("Max reconnection attempts reached"));
			return;
		}

		long delayMs = Math.min(reconnectDelayMs * attempt, 60000);
		log.info("Scheduling reconnection attempt {} for stream: {} in {}ms", attempt, streamKey, delayMs);
		broadcastToStreamListeners(streamKey, l -> l.onReconnecting(attempt));

		taskScheduler.schedule(() -> {
			log.info("Reconnecting stream: {} - attempt {}", streamKey, attempt);
			if ("!ticker@arr".equals(streamKey)) {
				startTickerStream(null);
			} else {
				String[] parts = streamKey.split("_", 2);
				if (parts.length == 2) {
					subscribeKline(parts[0], parts[1], null);
				}
			}
		}, new java.util.Date(System.currentTimeMillis() + delayMs));
	}

	private static String buildStreamKey(String symbol, String interval) {
		return symbol.toUpperCase() + "_" + interval;
	}

	private void registerListener(String streamKey, BinanceWebSocketListener listener) {
		listeners.computeIfAbsent(streamKey, k -> new CopyOnWriteArraySet<>());
		if (listener != null) {
			listeners.get(streamKey).add(listener);
		}
	}

	private void removeListener(String streamKey, BinanceWebSocketListener listener) {
		Set<BinanceWebSocketListener> set = listeners.get(streamKey);
		if (set != null && listener != null) {
			set.remove(listener);
		}
	}

	private void broadcastToStreamListeners(String streamKey, java.util.function.Consumer<BinanceWebSocketListener> action) {
		Set<BinanceWebSocketListener> streamListeners = listeners.get(streamKey);
		if (streamListeners != null) {
			streamListeners.forEach(action);
		}
	}

	private void closeSession(WebSocketSession session) {
		if (session != null && session.isOpen()) {
			try {
				session.close(CloseStatus.NORMAL);
			} catch (IOException e) {
				log.error("Error closing WebSocket session: {}", e.getMessage());
			}
		}
	}

	public boolean isTickerStreamActive() {
		return isTickerStreamActive && !tickerSession.isEmpty() && tickerSession.values().stream().anyMatch(WebSocketSession::isOpen);
	}

	public int getActiveKlineStreamCount() {
		return (int) klineSessions.values().stream().filter(WebSocketSession::isOpen).count();
	}
}
