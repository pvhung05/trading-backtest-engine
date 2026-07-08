package com.trading.realtime.client.rest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw DTO representing Binance 24hr ticker API response structure.
 * Contains 24-hour price change statistics for a trading pair.
 */
@Data
public class BinanceTicker24hrResponse {

	@JsonProperty("symbol")
	private String symbol;

	@JsonProperty("priceChange")
	private String priceChange;

	@JsonProperty("priceChangePercent")
	private String priceChangePercent;

	@JsonProperty("lastPrice")
	private String lastPrice;

	@JsonProperty("lastQty")
	private String lastQty;

	@JsonProperty("bidPrice")
	private String bidPrice;

	@JsonProperty("bidQty")
	private String bidQty;

	@JsonProperty("askPrice")
	private String askPrice;

	@JsonProperty("askQty")
	private String askQty;

	@JsonProperty("openPrice")
	private String openPrice;

	@JsonProperty("highPrice")
	private String highPrice;

	@JsonProperty("lowPrice")
	private String lowPrice;

	@JsonProperty("volume")
	private String volume;

	@JsonProperty("quoteVolume")
	private String quoteVolume;

	@JsonProperty("openTime")
	private Long openTime;

	@JsonProperty("closeTime")
	private Long closeTime;

	@JsonProperty("firstId")
	private Long firstId;

	@JsonProperty("lastId")
	private Long lastId;

	@JsonProperty("count")
	private Integer count;
}
