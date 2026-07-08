package com.trading.realtime.client.websocket.dto;

import lombok.Data;

/**
 * WebSocket subscribe/unsubscribe message format for Binance.
 */
@Data
public class BinanceWebSocketMessage {
	private String method;
	private Object[] params;
	private Integer id;

	public static BinanceWebSocketMessage subscribe(String... streams) {
		BinanceWebSocketMessage msg = new BinanceWebSocketMessage();
		msg.setMethod("SUBSCRIBE");
		msg.setParams(streams);
		msg.setId(1);
		return msg;
	}

	public static BinanceWebSocketMessage unsubscribe(String... streams) {
		BinanceWebSocketMessage msg = new BinanceWebSocketMessage();
		msg.setMethod("UNSUBSCRIBE");
		msg.setParams(streams);
		msg.setId(2);
		return msg;
	}

	public static BinanceWebSocketMessage ping() {
		BinanceWebSocketMessage msg = new BinanceWebSocketMessage();
		msg.setMethod("PING");
		msg.setParams(new Object[]{});
		msg.setId(3);
		return msg;
	}
}
