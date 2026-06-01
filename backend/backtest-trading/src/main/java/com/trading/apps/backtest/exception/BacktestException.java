package com.trading.apps.backtest.exception;

/**
 * Base runtime exception for backtest module failures.
 */
public class BacktestException extends RuntimeException {

    public BacktestException(String message) {
        super(message);
    }

    public BacktestException(String message, Throwable cause) {
        super(message, cause);
    }
}