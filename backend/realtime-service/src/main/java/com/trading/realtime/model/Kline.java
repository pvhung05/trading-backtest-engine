package com.trading.realtime.model;

import lombok.Builder;
import lombok.Data;

/**
 * Represents a single OHLCV candlestick/kline from Binance.
 * Used both for historical data retrieval via REST API and
 * real-time updates via WebSocket stream.
 */
@Data
@Builder
public class Kline {
	private long openTime;
	private String open;
	private String high;
	private String low;
	private String close;
	private String volume;
	private long closeTime;
	private String quoteVolume;
	private int trades;
	private String takerBuyBaseVolume;
	private String takerBuyQuoteVolume;
	private Boolean isClosed;

	public boolean getIsClosed() {
		return Boolean.TRUE.equals(isClosed);
	}
}
