package com.trading.apps.portfolio.validator;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.ta4j.core.BaseBarSeries;

import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.PortfolioConfig;

/**
 * Unit tests for {@link PortfolioValidator}.
 */
public class PortfolioValidatorTest {

    private final PortfolioValidator validator = new PortfolioValidator();

    private BaseBarSeries createSeries(int bars) {
        return new BaseBarSeries.BaseBarSeriesBuilder()
                .withName("test")
                .withNumBars(bars)
                .build();
    }

    @Test
    public void validate_validInputs_noException() {
        List<ExecutedTrade> trades = new ArrayList<>();
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(10000.0d).build();
        Assertions.assertDoesNotThrow(() -> validator.validate(trades, createSeries(10), config));
    }

    @Test
    public void validate_nullConfig_throwsIllegalArgumentException() {
        List<ExecutedTrade> trades = new ArrayList<>();
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> validator.validate(trades, createSeries(10), null));
    }

    @Test
    public void validate_nullTrades_throwsIllegalArgumentException() {
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(10000.0d).build();
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> validator.validate(null, createSeries(10), config));
    }

    @Test
    public void validate_invalidInitialCapital_throwsIllegalArgumentException() {
        List<ExecutedTrade> trades = new ArrayList<>();
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(0.0d).build();
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> validator.validate(trades, createSeries(10), config));
    }

    @Test
    public void validate_emptySeries_throwsIllegalArgumentException() {
        List<ExecutedTrade> trades = new ArrayList<>();
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(10000.0d).build();
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> validator.validate(trades, createSeries(0), config));
    }

    @Test
    public void validate_nullSeries_throwsIllegalArgumentException() {
        List<ExecutedTrade> trades = new ArrayList<>();
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(10000.0d).build();
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> validator.validate(trades, null, config));
    }
}
