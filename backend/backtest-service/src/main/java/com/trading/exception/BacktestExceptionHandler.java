package com.trading.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.trading.dto.response.ErrorResponse;
import com.trading.exception.BacktestException;

/**
 * Centralized exception handler for backtest API endpoints.
 */
@RestControllerAdvice(basePackages = "com.trading.controller")
public class BacktestExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        org.slf4j.LoggerFactory.getLogger(BacktestExceptionHandler.class).warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(BacktestException.class)
    public ResponseEntity<ErrorResponse> handleBacktestError(BacktestException ex) {
        org.slf4j.LoggerFactory.getLogger(BacktestExceptionHandler.class).warn("Backtest error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericError(Exception ex) {
        org.slf4j.LoggerFactory.getLogger(BacktestExceptionHandler.class).error("Unhandled error in backtest-service: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(ex.getMessage() != null ? ex.getMessage() : "Internal server error: " + ex.getClass().getSimpleName()));
    }
}