package com.trading.script.dto;

import com.trading.script.model.ScriptVisibility;
import java.time.Instant;

public record ScriptSummaryResponse(
        String id,
        Long userId,
        String title,
        String description,
        ScriptVisibility visibility,
        int latestVersion,
        Instant createdAt,
        Instant updatedAt
) {}
