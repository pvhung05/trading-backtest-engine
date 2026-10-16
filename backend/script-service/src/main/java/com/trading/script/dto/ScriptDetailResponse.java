package com.trading.script.dto;

import com.trading.script.model.ScriptVisibility;
import java.time.Instant;

public record ScriptDetailResponse(
        String id,
        Long userId,
        String title,
        String description,
        ScriptVisibility visibility,
        int versionNumber,
        String sourceCode,
        String compiledIr,
        String sourceHash,
        int astComplexityScore,
        Instant createdAt,
        Instant updatedAt
) {}
