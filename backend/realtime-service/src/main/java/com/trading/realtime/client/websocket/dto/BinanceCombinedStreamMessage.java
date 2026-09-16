package com.trading.realtime.client.websocket.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw DTO for Binance WebSocket stream list (combined stream format).
 * Binance sometimes sends combined stream messages with a stream field.
 */
@Data
public class BinanceCombinedStreamMessage<T> {

	@JsonProperty("stream")
	private String stream;

	@JsonProperty("data")
	private T data;
}
