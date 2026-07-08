package com.trading.realtime.service;

import com.trading.realtime.api.response.RealtimeKlineEvent;
import com.trading.realtime.api.response.RealtimeTickerEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service responsible for broadcasting real-time market data to connected frontend clients.
 * Uses Spring WebSocket (STOMP) to push updates to specific topics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketBroadcastService {

	private final SimpMessagingTemplate messagingTemplate;

	/**
	 * Broadcasts a ticker update to all subscribers of the watchlist topic.
	 *
	 * @param event the ticker update event
	 */
	public void broadcastTickerUpdate(RealtimeTickerEvent event) {
		if (event == null || event.getSymbol() == null) {
			return;
		}
		try {
			messagingTemplate.convertAndSend("/topic/watchlist", event);
			log.trace("Broadcasted ticker update for {}", event.getSymbol());
		} catch (Exception e) {
			log.error("Failed to broadcast ticker update for {}: {}", event.getSymbol(), e.getMessage());
		}
	}

	/**
	 * Broadcasts a kline update to subscribers of the specific chart topic.
	 *
	 * @param event the kline update event
	 */
	public void broadcastKlineUpdate(RealtimeKlineEvent event) {
		if (event == null || event.getSymbol() == null || event.getInterval() == null) {
			return;
		}
		try {
			String destination = buildChartDestination(event.getSymbol(), event.getInterval());
			messagingTemplate.convertAndSend(destination, event);
			log.trace("Broadcasted kline update for {} {}", event.getSymbol(), event.getInterval());
		} catch (Exception e) {
			log.error("Failed to broadcast kline update for {} {}: {}", event.getSymbol(), event.getInterval(), e.getMessage());
		}
	}

	/**
	 * Broadcasts a kline update to a specific user's session.
	 *
	 * @param sessionId the WebSocket session ID
	 * @param event     the kline update event
	 */
	public void sendKlineUpdateToUser(String sessionId, RealtimeKlineEvent event) {
		if (sessionId == null || event == null) {
			return;
		}
		try {
			String destination = buildChartDestination(event.getSymbol(), event.getInterval());
			messagingTemplate.convertAndSendToUser(sessionId, destination, event);
			log.trace("Sent kline update to user session {} for {} {}", sessionId, event.getSymbol(), event.getInterval());
		} catch (Exception e) {
			log.error("Failed to send kline update to user {}: {}", sessionId, e.getMessage());
		}
	}

	/**
	 * Broadcasts a ticker update to a specific user.
	 *
	 * @param sessionId the WebSocket session ID
	 * @param event     the ticker update event
	 */
	public void sendTickerUpdateToUser(String sessionId, RealtimeTickerEvent event) {
		if (sessionId == null || event == null) {
			return;
		}
		try {
			messagingTemplate.convertAndSendToUser(sessionId, "/topic/watchlist", event);
			log.trace("Sent ticker update to user session {}", sessionId);
		} catch (Exception e) {
			log.error("Failed to send ticker update to user {}: {}", sessionId, e.getMessage());
		}
	}

	/**
	 * Builds the STOMP destination path for chart updates.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @return the destination path
	 */
	private String buildChartDestination(String symbol, String interval) {
		return "/topic/chart/" + symbol.toUpperCase() + "/" + interval;
	}
}
