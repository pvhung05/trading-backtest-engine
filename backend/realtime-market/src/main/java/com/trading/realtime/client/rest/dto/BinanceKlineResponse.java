package com.trading.realtime.client.rest.dto;

import lombok.Data;

/**
 * Raw DTO representing a single kline/candlestick from Binance klines API.
 * Each kline is represented as an array of values.
 * Index: 0=openTime, 1=open, 2=high, 3=low, 4=close, 5=volume,
 *        6=closeTime, 7=quoteVolume, 8=trades, 9=takerBuyBaseVol,
 *        10=takerBuyQuoteVol, 11=isClosed
 */
@Data
public class BinanceKlineResponse {

	private Long openTime;
	private String open;
	private String high;
	private String low;
	private String close;
	private String volume;
	private Long closeTime;
	private String quoteVolume;
	private Integer trades;
	private String takerBuyBaseVolume;
	private String takerBuyQuoteVolume;
	private Boolean isClosed;

	public static BinanceKlineResponse fromArray(Object[] arr) {
		if (arr == null || arr.length < 11) {
			return null;
		}
		BinanceKlineResponse kline = new BinanceKlineResponse();
		kline.setOpenTime(toLong(arr[0]));
		kline.setOpen(toString(arr[1]));
		kline.setHigh(toString(arr[2]));
		kline.setLow(toString(arr[3]));
		kline.setClose(toString(arr[4]));
		kline.setVolume(toString(arr[5]));
		kline.setCloseTime(toLong(arr[6]));
		kline.setQuoteVolume(toString(arr[7]));
		kline.setTrades(toInt(arr[8]));
		kline.setTakerBuyBaseVolume(toString(arr[9]));
		kline.setTakerBuyQuoteVolume(toString(arr[10]));
		if (arr.length > 11) {
			kline.setIsClosed(toBoolean(arr[11]));
		}
		return kline;
	}

	private static Long toLong(Object val) {
		if (val == null) return null;
		if (val instanceof Number) return ((Number) val).longValue();
		try {
			return Long.parseLong(val.toString());
		} catch (NumberFormatException e) {
			return null;
		}
	}

	private static Integer toInt(Object val) {
		if (val == null) return 0;
		if (val instanceof Number) return ((Number) val).intValue();
		try {
			return Integer.parseInt(val.toString());
		} catch (NumberFormatException e) {
			return 0;
		}
	}

	private static String toString(Object val) {
		return val == null ? null : val.toString();
	}

	private static Boolean toBoolean(Object val) {
		if (val == null) return false;
		if (val instanceof Boolean) return (Boolean) val;
		return Boolean.parseBoolean(val.toString());
	}
}
