package com.trading.realtime.client.websocket.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw DTO for Binance !ticker@arr WebSocket stream message.
 * Contains 24hr ticker statistics for a single symbol.
 */
@Data
public class BinanceTickerStreamMessage {

	@JsonProperty("e")
	private String eventType;

	@JsonProperty("E")
	private Long eventTime;

	@JsonProperty("s")
	private String symbol;

	@JsonProperty("p")
	private String priceChange;

	@JsonProperty("P")
	private String priceChangePercent;

	@JsonProperty("w")
	private String weightedAveragePrice;

	@JsonProperty("c")
	private String lastPrice;

	@JsonProperty("Q")
	private String lastQuantity;

	@JsonProperty("o")
	private String openPrice;

	@JsonProperty("h")
	private String highPrice;

	@JsonProperty("l")
	private String lowPrice;

	@JsonProperty("v")
	private String volume;

	@JsonProperty("q")
	private String quoteVolume;

	@JsonProperty("O")
	private Long openTime;

	@JsonProperty("C")
	private Long closeTime;

	@JsonProperty("F")
	private Long firstTradeId;

	@JsonProperty("L")
	private Long lastTradeId;

	@JsonProperty("n")
	private Integer totalTrades;
}
