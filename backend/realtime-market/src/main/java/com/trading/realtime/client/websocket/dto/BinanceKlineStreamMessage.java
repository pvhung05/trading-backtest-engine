package com.trading.realtime.client.websocket.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw DTO for Binance kline WebSocket stream message.
 * Contains candlestick data for a symbol.
 */
@Data
public class BinanceKlineStreamMessage {

	@JsonProperty("e")
	private String eventType;

	@JsonProperty("E")
	private Long eventTime;

	@JsonProperty("s")
	private String symbol;

	@JsonProperty("k")
	private KlineData k;

	@Data
	public static class KlineData {
		@JsonProperty("t")
		private Long openTime;

		@JsonProperty("T")
		private Long closeTime;

		@JsonProperty("s")
		private String symbol;

		@JsonProperty("i")
		private String interval;

		@JsonProperty("f")
		private Long firstTradeId;

		@JsonProperty("L")
		private Long lastTradeId;

		@JsonProperty("o")
		private String open;

		@JsonProperty("c")
		private String close;

		@JsonProperty("h")
		private String high;

		@JsonProperty("l")
		private String low;

		@JsonProperty("v")
		private String volume;

		@JsonProperty("n")
		private Integer numberOfTrades;

		@JsonProperty("x")
		private Boolean isClosed;

		@JsonProperty("q")
		private String quoteVolume;

		@JsonProperty("V")
		private String takerBuyBaseVolume;

		@JsonProperty("Q")
		private String takerBuyQuoteVolume;

		@JsonProperty("B")
		private String ignore;
	}
}
