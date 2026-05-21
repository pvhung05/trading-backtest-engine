package com.trading.apps.api.exception.market;

/**
 * Standard error payload for API endpoints.
 */
public record ErrorResponse(
        String message
) {
}