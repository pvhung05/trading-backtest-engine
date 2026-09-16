package com.trading.auth.dto.response;

public record AuthResponse(
        String token,
        String tokenType,
        UserResponse user
) {
}
