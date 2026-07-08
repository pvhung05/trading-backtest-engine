package com.trading.realtime.model;

import lombok.Builder;
import lombok.Data;

/**
 * Represents 24-hour rolling ticker statistics for a symbol.
 * This data is fetched from Binance and cached in memory, updated via WebSocket
 * to provide real-time market overview for the watchlist.
 */
@Data
@Builder
public class MarketTicker {
	private String symbol;
	private String lastPrice;
	private String priceChange;
	private String priceChangePercent;
	private String highPrice;
	private String lowPrice;
	private String volume;
	private String quoteVolume;
	private long openTime;
	private long closeTime;
	private int count;
}
