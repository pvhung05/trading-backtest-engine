package com.trading.apps.api.request.portfolio;

import com.trading.apps.execution.model.ExecutionConfig;
import com.trading.apps.execution.model.ExecutionSimulationCommand;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.util.TimeframeUtil;
import com.trading.apps.portfolio.model.PortfolioConfig;
import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.strategy.model.MacdParameters;
import com.trading.apps.strategy.model.RsiParameters;
import com.trading.apps.strategy.model.SmaCrossParameters;
import com.trading.apps.strategy.model.StrategyParameters;

import lombok.Data;

import java.time.Instant;
import java.time.format.DateTimeParseException;

/**
 * Request DTO for running a full portfolio simulation.
 * Combines market data, strategy, execution config, and portfolio capital.
 */
@Data
public class PortfolioSimulationRequest {

    private String symbol;
    private String timeframe;
    private String startTime;
    private String endTime;
    private StrategyType strategyType;
    private Integer shortPeriod;
    private Integer longPeriod;
    private Integer signalPeriod;
    private Integer period;
    private Double overbought;
    private Double oversold;
    private Double commissionRate;
    private Double slippageRate;
    private Double positionSizePercent;
    private Double capital;

    /**
     * Builds an ExecutionSimulationCommand for the execution phase.
     * The portfolio capital is embedded so executed trades can be calculated.
     */
    public ExecutionSimulationCommand toExecutionCommand() {
        MarketDataRequest marketDataRequest = toMarketDataRequest();
        StrategyType selectedStrategyType = requireValue(strategyType, "strategyType");
        StrategyParameters strategyParameters = toStrategyParameters(selectedStrategyType);

        ExecutionConfig executionConfig = ExecutionConfig.builder()
                .commissionRate(requireNonNegative(commissionRate, "commissionRate"))
                .slippageRate(requireNonNegative(slippageRate, "slippageRate"))
                .positionSizePercent(requirePositiveDouble(positionSizePercent, "positionSizePercent"))
                .build();

        return ExecutionSimulationCommand.builder()
                .marketDataRequest(marketDataRequest)
                .strategyType(selectedStrategyType)
                .strategyParameters(strategyParameters)
                .executionConfig(executionConfig)
                .capital(requirePositiveDouble(capital, "capital"))
                .build();
    }

    /**
     * Builds a PortfolioConfig for the portfolio phase.
     */
    public PortfolioConfig toPortfolioConfig() {
        return PortfolioConfig.builder()
                .initialCapital(requirePositiveDouble(capital, "capital"))
                .build();
    }

    private MarketDataRequest toMarketDataRequest() {
        String normalizedSymbol = requireValue(symbol, "symbol").toUpperCase();
        String normalizedTimeframe = requireValue(timeframe, "timeframe").toLowerCase();
        if (!TimeframeUtil.isSupported(normalizedTimeframe)) {
            throw new IllegalArgumentException("unsupported timeframe: " + normalizedTimeframe);
        }

        try {
            Instant parsedStartTime = Instant.parse(requireValue(startTime, "startTime"));
            Instant parsedEndTime = parseEndTimeOrNow(endTime);
            return new MarketDataRequest(normalizedSymbol, normalizedTimeframe, parsedStartTime, parsedEndTime);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("startTime and endTime must be ISO-8601 instant format", ex);
        }
    }

    private StrategyParameters toStrategyParameters(StrategyType selectedStrategyType) {
        return switch (selectedStrategyType) {
            case SMA_CROSS -> new SmaCrossParameters(
                    requirePositive(shortPeriod, "shortPeriod"),
                    requirePositive(longPeriod, "longPeriod"));
            case RSI -> new RsiParameters(
                    requirePositive(period, "period"),
                    requireNonNull(overbought, "overbought"),
                    requireNonNull(oversold, "oversold"));
            case MACD -> new MacdParameters(
                    requirePositive(shortPeriod, "shortPeriod"),
                    requirePositive(longPeriod, "longPeriod"),
                    requirePositive(signalPeriod, "signalPeriod"));
        };
    }

    private Instant parseEndTimeOrNow(String rawEndTime) {
        if (rawEndTime == null || rawEndTime.isBlank()) {
            return Instant.now();
        }
        return Instant.parse(rawEndTime.trim());
    }

    private String requireValue(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim();
    }

    private <T> T requireValue(T value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value;
    }

    private Integer requirePositive(Integer value, String fieldName) {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException(fieldName + " must be greater than 0");
        }
        return value;
    }

    private Double requirePositiveDouble(Double value, String fieldName) {
        if (value == null || value <= 0.0d) {
            throw new IllegalArgumentException(fieldName + " must be greater than 0");
        }
        return value;
    }

    private Double requireNonNegative(Double value, String fieldName) {
        if (value == null || value < 0.0d) {
            throw new IllegalArgumentException(fieldName + " must be greater than or equal to 0");
        }
        return value;
    }

    private Double requireNonNull(Double value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value;
    }
}
