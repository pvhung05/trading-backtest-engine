package com.trading.script.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record RunScriptJobRequest(
        String scriptId,
        String sourceCode,
        @NotNull String symbol,
        @NotNull String timeframe,
        @NotNull Instant startTime,
        Instant endTime,
        Double initialCapital,
        Double commissionRate,
        Double slippageRate,
        Double positionSizePercent,
        String idempotencyKey
) {
    public Instant getEndTimeOrNow() {
        return endTime != null ? endTime : Instant.now();
    }

    public double getInitialCapitalOrDefault() {
        return initialCapital != null ? initialCapital : 10000.0;
    }

    public double getCommissionRateOrDefault() {
        return commissionRate != null ? commissionRate : 0.001;
    }

    public double getSlippageRateOrDefault() {
        return slippageRate != null ? slippageRate : 0.0005;
    }

    public double getPositionSizePercentOrDefault() {
        return positionSizePercent != null ? positionSizePercent : 100.0;
    }
}
