package com.trading.apps.api.exception.market;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.trading.apps.market.exception.MarketDataException;

/**
 * Centralized exception handler for market API endpoints.
 */
@RestControllerAdvice(basePackages = "com.trading.apps.api.controller")
public class MarketDataExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(ex.getMessage()));
    }

    @ExceptionHandler(MarketDataException.class)
    public ResponseEntity<ErrorResponse> handleMarketDataError(MarketDataException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ErrorResponse(ex.getMessage()));
    }
}
