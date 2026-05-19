package com.trading.apps.market.exception;

/**
 * Base exception for all market data related errors.
 * Indicates failures in data loading, parsing, or caching operations.
 *
 * @author Trading System
 */
public class MarketDataException extends RuntimeException {

    /**
     * Constructs a MarketDataException with a message.
     *
     * @param message the detail message
     */
    public MarketDataException(String message) {
        super(message);
    }

    /**
     * Constructs a MarketDataException with a message and cause.
     *
     * @param message the detail message
     * @param cause   the cause
     */
    public MarketDataException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Constructs a MarketDataException with a cause.
     *
     * @param cause the cause
     */
    public MarketDataException(Throwable cause) {
        super(cause);
    }
}
