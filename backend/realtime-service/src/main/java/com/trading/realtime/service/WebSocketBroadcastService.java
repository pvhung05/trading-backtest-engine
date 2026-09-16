package com.trading.realtime.service;

import com.trading.realtime.dto.response.RealtimeKlineEvent;
import com.trading.realtime.dto.response.RealtimeTickerEvent;

/**
 * Service interface for broadcasting real-time market data to connected frontend clients.
 * Uses Spring WebSocket (STOMP) to push updates to specific topics.
 */
public interface WebSocketBroadcastService {

	/**
	 * Broadcasts a ticker update to all subscribers of the watchlist topic.
	 *
	 * @param event the ticker update event
	 */
	void broadcastTickerUpdate(RealtimeTickerEvent event);

	/**
	 * Broadcasts a kline update to subscribers of the specific chart topic.
	 *
	 * @param event the kline update event
	 */
	void broadcastKlineUpdate(RealtimeKlineEvent event);

	/**
	 * Broadcasts a kline update to a specific user's session.
	 *
	 * @param sessionId the WebSocket session ID
	 * @param event     the kline update event
	 */
	void sendKlineUpdateToUser(String sessionId, RealtimeKlineEvent event);

	/**
	 * Broadcasts a ticker update to a specific user.
	 *
	 * @param sessionId the WebSocket session ID
	 * @param event     the ticker update event
	 */
	void sendTickerUpdateToUser(String sessionId, RealtimeTickerEvent event);
}
