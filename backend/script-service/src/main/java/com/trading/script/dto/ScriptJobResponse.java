package com.trading.script.dto;

import com.trading.script.model.JobStatus;
import lombok.Builder;

import java.time.Instant;

@Builder
public record ScriptJobResponse(
        String jobId,
        Long userId,
        String scriptId,
        String symbol,
        String timeframe,
        JobStatus status,
        String errorCode,
        String errorMessage,
        Long backtestRunId,
        Long durationMs,
        Object result,
        Instant createdAt,
        Instant updatedAt
) {}
