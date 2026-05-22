package com.trading.apps.api.response.auth;

import java.time.Instant;

public record UserResponse(
        Long id,
        String username,
        String email,
        String role,
        boolean enabled,
        Instant createdAt
) {
}