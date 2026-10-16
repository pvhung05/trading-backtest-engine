package com.trading.dto.request;

import java.time.Instant;
import java.util.Map;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record DynamicRunRequest(
        Long userId,
        @NotNull String symbol,
        @NotNull String timeframe,
        @NotNull Instant startTime,
        Instant endTime,
        Map<String, Object> entryRule,
        Map<String, Object> exitRule,
        Integer warmupBars,
        Double initialCapital,
        Double commissionRate,
        Double slippageRate,
        Double positionSizePercent
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

    public Long getUserIdOrDefault() {
        return userId != null ? userId : 1L;
    }
}
