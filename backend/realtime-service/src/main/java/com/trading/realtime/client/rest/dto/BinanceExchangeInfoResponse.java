package com.trading.realtime.client.rest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Raw DTO representing Binance exchangeInfo API response structure.
 * Contains trading pair metadata from the exchange.
 */
@Data
public class BinanceExchangeInfoResponse {

	@JsonProperty("timezone")
	private String timezone;

	@JsonProperty("serverTime")
	private Long serverTime;

	@JsonProperty("symbols")
	private java.util.List<Symbol> symbols;

	@Data
	public static class Symbol {
		@JsonProperty("symbol")
		private String symbol;

		@JsonProperty("status")
		private String status;

		@JsonProperty("baseAsset")
		private String baseAsset;

		@JsonProperty("baseAssetPrecision")
		private Integer baseAssetPrecision;

		@JsonProperty("quoteAsset")
		private String quoteAsset;

		@JsonProperty("quotePrecision")
		private Integer quotePrecision;

		@JsonProperty("quoteAssetPrecision")
		private Integer quoteAssetPrecision;

		@JsonProperty("orderTypes")
		private java.util.List<String> orderTypes;

		@JsonProperty("icebergAllowed")
		private Boolean icebergAllowed;

		@JsonProperty("ocoAllowed")
		private Boolean ocoAllowed;

		@JsonProperty("isSpotTradingAllowed")
		private Boolean isSpotTradingAllowed;

		@JsonProperty("tradingPermissions")
		private java.util.List<String> tradingPermissions;
	}
}
