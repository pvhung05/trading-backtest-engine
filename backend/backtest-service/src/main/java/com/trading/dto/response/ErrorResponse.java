package com.trading.dto.response;

/**
 * Standard error payload for API endpoints.
 */
public record ErrorResponse(
        String message
) {
}