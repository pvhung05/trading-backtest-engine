package com.trading.realtime.api.websocket;

import com.trading.realtime.api.request.SubscribeChartRequest;
import com.trading.realtime.model.ChartSubscription;
import com.trading.realtime.model.Interval;
import com.trading.realtime.model.Kline;
import com.trading.realtime.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket controller for handling real-time chart subscriptions.
 * Manages the lifecycle of chart subscriptions when frontend clients connect/disconnect.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChartWebSocketController {

	private final MarketDataService marketDataService;

	private final Map<String, String> sessionSubscriptions = new ConcurrentHashMap<>();

	/**
	 * Handles chart subscription requests from frontend.
	 * Creates or joins an existing subscription for the symbol+interval combination.
	 *
	 * @param request   the subscription request
	 * @param accessor  the message header accessor containing session info
	 * @return the chart subscription details
	 */
	@MessageMapping("/chart/subscribe")
	@SendToUser("/topic/chart")
	public ChartSubscription subscribeToChart(
			@Payload SubscribeChartRequest request,
			SimpMessageHeaderAccessor accessor) {

		String sessionId = accessor.getSessionId();
		String symbol = request.getSymbol().toUpperCase();
		String interval = request.getInterval();

		log.info("WebSocket subscribe request: {} {} from session {}", symbol, interval, sessionId);

		Interval.validate(interval);

		ChartSubscription subscription = marketDataService.subscribeToChart(symbol, interval, sessionId);

		String key = sessionId + "_" + symbol + "_" + interval;
		sessionSubscriptions.put(key, key);

		return subscription;
	}

	/**
	 * Handles chart unsubscription requests from frontend.
	 * Decrements the subscriber count without immediately closing the WebSocket.
	 *
	 * @param symbol     the trading symbol
	 * @param interval   the candlestick interval
	 * @param accessor   the message header accessor
	 */
	@MessageMapping("/chart/unsubscribe/{symbol}/{interval}")
	public void unsubscribeFromChart(
			@DestinationVariable String symbol,
			@DestinationVariable String interval,
			SimpMessageHeaderAccessor accessor) {

		String sessionId = accessor.getSessionId();
		symbol = symbol.toUpperCase();

		log.info("WebSocket unsubscribe request: {} {} from session {}", symbol, interval, sessionId);

		marketDataService.unsubscribeFromChart(symbol, interval);

		String key = sessionId + "_" + symbol + "_" + interval;
		sessionSubscriptions.remove(key);
	}

	/**
	 * Retrieves the latest candle for a chart subscription.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @param accessor the message header accessor
	 * @return the latest candle if available
	 */
	@MessageMapping("/chart/latest/{symbol}/{interval}")
	@SendToUser("/topic/chart")
	public Kline getLatestCandle(
			@DestinationVariable String symbol,
			@DestinationVariable String interval,
			SimpMessageHeaderAccessor accessor) {

		symbol = symbol.toUpperCase();

		return marketDataService.getLatestCandle(symbol, interval).orElse(null);
	}

	/**
	 * Handles WebSocket session connect events.
	 */
	@EventListener
	public void handleWebSocketConnectListener(SessionConnectEvent event) {
		String sessionId = event.getMessage().getHeaders().get("simpSessionId", String.class);
		log.info("WebSocket session connected: {}", sessionId);
	}

	/**
	 * Handles WebSocket session disconnect events.
	 * Cleans up all subscriptions for the disconnected session.
	 */
	@EventListener
	public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
		String sessionId = event.getSessionId();
		log.info("WebSocket session disconnected: {}", sessionId);

		sessionSubscriptions.entrySet().removeIf(entry -> {
			String key = entry.getKey();
			if (key.startsWith(sessionId + "_")) {
				String[] parts = key.substring(sessionId.length() + 1).split("_");
				if (parts.length >= 2) {
					String symbol = parts[0];
					String interval = parts[1];
					log.debug("Auto-unsubscribing {} {} for disconnected session {}", symbol, interval, sessionId);
					marketDataService.unsubscribeFromChart(symbol, interval);
					return true;
				}
			}
			return false;
		});
	}
}
