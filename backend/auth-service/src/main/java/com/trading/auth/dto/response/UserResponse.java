package com.trading.auth.dto.response;

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
