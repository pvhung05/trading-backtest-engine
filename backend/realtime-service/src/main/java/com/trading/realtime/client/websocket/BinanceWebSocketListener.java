package com.trading.realtime.client.websocket;

import com.trading.realtime.model.Kline;
import com.trading.realtime.model.MarketTicker;

/**
 * Callback interface for receiving real-time market data from WebSocket streams.
 * Implementations handle ticker and kline updates.
 */
public interface BinanceWebSocketListener {

	/**
	 * Called when ticker data is received from !ticker@arr stream.
	 *
	 * @param ticker the updated market ticker
	 */
	default void onTickerUpdate(MarketTicker ticker) {
	}

	/**
	 * Called when kline data is received from a kline stream.
	 *
	 * @param symbol   the trading symbol
	 * @param interval the candlestick interval
	 * @param kline    the updated candle
	 */
	default void onKlineUpdate(String symbol, String interval, Kline kline) {
	}

	/**
	 * Called when the WebSocket connection is established.
	 */
	default void onConnected() {
	}

	/**
	 * Called when the WebSocket connection is closed.
	 *
	 * @param code   the close code
	 * @param reason the close reason
	 */
	default void onDisconnected(int code, String reason) {
	}

	/**
	 * Called when a reconnection attempt is about to start.
	 *
	 * @param attemptNumber the current attempt number
	 */
	default void onReconnecting(int attemptNumber) {
	}

	/**
	 * Called when an error occurs on the WebSocket connection.
	 *
	 * @param error the error message
	 */
	default void onError(String error) {
	}
}
