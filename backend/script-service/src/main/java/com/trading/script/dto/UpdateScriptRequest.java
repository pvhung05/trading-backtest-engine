package com.trading.script.dto;

import com.trading.script.model.ScriptVisibility;
import jakarta.validation.constraints.Size;

public record UpdateScriptRequest(
        @Size(max = 150) String title,
        String description,
        String sourceCode,
        ScriptVisibility visibility
) {}
