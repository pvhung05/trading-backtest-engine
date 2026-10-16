package com.trading.script.dto;

import jakarta.validation.constraints.NotBlank;

public record CompileScriptRequest(
        @NotBlank String sourceCode
) {}
