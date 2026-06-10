package com.trading.apps.api.exception.portfolio;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.trading.apps.api.exception.market.ErrorResponse;
import com.trading.apps.backtest.exception.BacktestException;

/**
 * Centralized exception handler for portfolio API endpoints.
 */
@RestControllerAdvice(basePackages = "com.trading.apps.api.controller.portfolio")
public class PortfolioExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(BacktestException.class)
    public ResponseEntity<ErrorResponse> handleBacktestError(BacktestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(ex.getMessage()));
    }
}
