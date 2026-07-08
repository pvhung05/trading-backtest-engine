package com.trading.realtime.exception;

/**
 * Exception thrown when Binance API calls fail.
 */
public class BinanceApiException extends RuntimeException {

	public BinanceApiException(String message) {
		super(message);
	}

	public BinanceApiException(String message, Throwable cause) {
		super(message, cause);
	}
}
