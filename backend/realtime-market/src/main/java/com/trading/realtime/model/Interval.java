package com.trading.realtime.model;

/**
 * Enum representing supported candlestick intervals for Binance kline streams.
 */
public enum Interval {
	ONE_MINUTE("1m"),
	THREE_MINUTES("3m"),
	FIVE_MINUTES("5m"),
	FIFTEEN_MINUTES("15m"),
	THIRTY_MINUTES("30m"),
	ONE_HOUR("1h"),
	TWO_HOURS("2h"),
	FOUR_HOURS("4h"),
	SIX_HOURS("6h"),
	EIGHT_HOURS("8h"),
	TWELVE_HOURS("12h"),
	ONE_DAY("1d"),
	THREE_DAYS("3d"),
	ONE_WEEK("1w"),
	ONE_MONTH("1M");

	private final String binanceValue;

	Interval(String binanceValue) {
		this.binanceValue = binanceValue;
	}

	public String getBinanceValue() {
		return binanceValue;
	}

	public static Interval fromBinanceValue(String value) {
		if (value == null) {
			return null;
		}
		for (Interval interval : values()) {
			if (interval.binanceValue.equalsIgnoreCase(value)) {
				return interval;
			}
		}
		return null;
	}

	public static String toWebSocketStream(String symbol, String interval) {
		return symbol.toLowerCase() + "@kline_" + interval;
	}

	public static String fromWebSocketStream(String stream) {
		int klineIndex = stream.indexOf("@kline_");
		if (klineIndex == -1) {
			return null;
		}
		return stream.substring(klineIndex + 7);
	}

	public static String extractSymbolFromStream(String stream) {
		int atIndex = stream.indexOf('@');
		if (atIndex == -1) {
			return null;
		}
		return stream.substring(0, atIndex).toUpperCase();
	}

	/**
	 * Validates if the given interval string is a valid Binance interval.
	 *
	 * @param interval the interval string to validate
	 * @throws IllegalArgumentException if the interval is invalid
	 */
	public static void validate(String interval) {
		if (interval == null || interval.isBlank()) {
			throw new IllegalArgumentException("Interval cannot be null or blank");
		}
		Interval valid = fromBinanceValue(interval);
		if (valid == null) {
			throw new IllegalArgumentException(
					"Invalid interval: " + interval + ". Valid intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M"
			);
		}
	}
}
