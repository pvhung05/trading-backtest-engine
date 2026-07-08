package com.trading.realtime.exception;

/**
 * Exception thrown when a requested symbol is not found.
 */
public class SymbolNotFoundException extends RuntimeException {

	public SymbolNotFoundException(String symbol) {
		super("Symbol not found: " + symbol);
	}

	public SymbolNotFoundException(String symbol, Throwable cause) {
		super("Symbol not found: " + symbol, cause);
	}
}
