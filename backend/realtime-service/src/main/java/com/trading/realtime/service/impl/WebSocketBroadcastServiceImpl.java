package com.trading.realtime.service.impl;

import com.trading.realtime.dto.response.RealtimeKlineEvent;
import com.trading.realtime.dto.response.RealtimeTickerEvent;
import com.trading.realtime.service.WebSocketBroadcastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Implementation of WebSocketBroadcastService.
 * Uses Spring WebSocket (STOMP) SimpMessagingTemplate to push updates to specific topics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketBroadcastServiceImpl implements WebSocketBroadcastService {

	private final SimpMessagingTemplate messagingTemplate;

	@Override
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

	@Override
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

	@Override
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

	@Override
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
