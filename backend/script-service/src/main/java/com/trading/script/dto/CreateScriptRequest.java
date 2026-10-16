package com.trading.script.dto;

import com.trading.script.model.ScriptVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateScriptRequest(
        @NotBlank @Size(max = 150) String title,
        String description,
        @NotBlank String sourceCode,
        ScriptVisibility visibility
) {
    public ScriptVisibility getVisibilityOrDefault() {
        return visibility != null ? visibility : ScriptVisibility.PRIVATE;
    }
}
