package com.trading.apps.api.request;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RunBacktestRequest(
        @NotNull String symbol,
        @NotNull String timeframe,
        @NotNull Instant startTime,
        Instant endTime,
        @NotNull String strategyType,
        @NotNull StrategyParams strategyParams,
        @JsonProperty("initialCapital")
        @NotNull @DecimalMin("0.0") double initialCapital,
        @JsonProperty("commissionRate")
        double commissionRate,
        @JsonProperty("slippageRate")
        double slippageRate,
        @JsonProperty("positionSizePercent")
        double positionSizePercent
) {

    public Instant getEndTimeOrNow() {
        return endTime != null ? endTime : Instant.now();
    }

    public record StrategyParams(
            @Size(min = 1) java.util.Map<String, Object> params
    ) {
    }
}
