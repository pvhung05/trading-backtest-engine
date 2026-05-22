package com.trading.apps.api.response.auth;

public record AuthResponse(
        String token,
        String tokenType,
        UserResponse user
) {
}