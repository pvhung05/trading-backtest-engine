package com.trading.dto.request;

import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record RunBacktestRequest(
        @NotNull String symbol,
        @NotNull String timeframe,
        @NotNull Instant startTime,
        Instant endTime,
        @NotNull String strategyType,
        @NotNull Map<String, Object> strategyParams,
        @JsonProperty("initialCapital")
        @NotNull @DecimalMin("0.0") Double initialCapital,
        @JsonProperty("commissionRate")
        Double commissionRate,
        @JsonProperty("slippageRate")
        Double slippageRate,
        @JsonProperty("positionSizePercent")
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
}

