package com.trading.strategy;

import com.trading.strategy.enums.StrategyType;
import com.trading.strategy.factory.DynamicRuleStrategyFactory;
import com.trading.strategy.model.DynamicStrategyParameters;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseBarSeriesBuilder;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;
import org.ta4j.core.backtest.BarSeriesManager;
import org.ta4j.core.num.DecimalNum;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class DynamicRuleStrategyFactoryTest {

    private DynamicRuleStrategyFactory factory;

    @BeforeEach
    void setUp() {
        factory = new DynamicRuleStrategyFactory();
    }

    @Test
    @DisplayName("Should return DYNAMIC_DSL strategy type")
    void shouldReturnCorrectStrategyType() {
        assertEquals(StrategyType.DYNAMIC_DSL, factory.getType());
    }

    @Test
    @DisplayName("Should build TA4J Strategy and execute backtest with dynamic IR rules")
    void shouldBuildAndExecuteDynamicStrategy() {
        BarSeries series = new BaseBarSeriesBuilder().withName("TEST_SERIES").build();
        Instant now = Instant.now();
        double[] prices = {10, 11, 12, 14, 16, 18, 17, 15, 12, 10, 8, 6, 7, 8, 10, 12, 15, 18, 16, 13, 10, 7};
        Duration duration = Duration.ofMinutes(5);

        for (int i = 0; i < prices.length; i++) {
            Bar bar = series.barBuilder()
                    .timePeriod(duration)
                    .endTime(now.plusSeconds(i * 300))
                    .openPrice(DecimalNum.valueOf(prices[i]))
                    .highPrice(DecimalNum.valueOf(prices[i] + 1))
                    .lowPrice(DecimalNum.valueOf(prices[i] - 1))
                    .closePrice(DecimalNum.valueOf(prices[i]))
                    .volume(DecimalNum.valueOf(100))
                    .build();
            series.addBar(bar);
        }

        Map<String, Object> entryRule = Map.of(
                "type", "CROSSED_UP",
                "left", Map.of("indicator", "SMA", "period", 2),
                "right", Map.of("indicator", "SMA", "period", 4)
        );

        Map<String, Object> exitRule = Map.of(
                "type", "CROSSED_DOWN",
                "left", Map.of("indicator", "SMA", "period", 2),
                "right", Map.of("indicator", "SMA", "period", 4)
        );

        DynamicStrategyParameters params = DynamicStrategyParameters.builder()
                .entryRule(entryRule)
                .exitRule(exitRule)
                .warmupBars(4)
                .entrySignalName("SMA Cross Up")
                .exitSignalName("SMA Cross Down")
                .build();

        Strategy strategy = factory.build(series, params);
        assertNotNull(strategy);
        assertNotNull(strategy.getEntryRule());
        assertNotNull(strategy.getExitRule());

        BarSeriesManager manager = new BarSeriesManager(series);
        TradingRecord record = manager.run(strategy);

        assertNotNull(record);
        // Verify that the trading record recorded entries and exits
        assertTrue(record.getPositionCount() > 0 || record.getCurrentPosition().isOpened(), 
                "Should trigger trading action based on crossover rules");
    }

    @Test
    @DisplayName("Should build strategy with Bollinger Bands, ATR, GTE, LTE, and NOT rules")
    void shouldBuildStrategyWithBollingerAndAtr() {
        BarSeries series = new BaseBarSeriesBuilder().withName("BB_TEST_SERIES").build();
        Instant now = Instant.now();
        double[] prices = {100, 102, 104, 103, 105, 108, 110, 109, 107, 104, 102, 101, 99, 98, 97, 100, 103, 106, 108, 111};
        Duration duration = Duration.ofMinutes(5);

        for (int i = 0; i < prices.length; i++) {
            Bar bar = series.barBuilder()
                    .timePeriod(duration)
                    .endTime(now.plusSeconds(i * 300))
                    .openPrice(DecimalNum.valueOf(prices[i]))
                    .highPrice(DecimalNum.valueOf(prices[i] + 2))
                    .lowPrice(DecimalNum.valueOf(prices[i] - 2))
                    .closePrice(DecimalNum.valueOf(prices[i]))
                    .volume(DecimalNum.valueOf(500))
                    .build();
            series.addBar(bar);
        }

        Map<String, Object> entryRule = Map.of(
                "type", "CROSSED_UP",
                "left", Map.of("indicator", "CLOSE"),
                "right", Map.of("indicator", "BOLLINGER_LOWER", "period", 5, "multiplier", 2.0)
        );

        Map<String, Object> exitRule = Map.of(
                "type", "AND",
                "left", Map.of(
                        "type", "GREATER_EQUAL",
                        "left", Map.of("indicator", "CLOSE"),
                        "right", Map.of("indicator", "BOLLINGER_UPPER", "period", 5, "multiplier", 2.0)
                ),
                "right", Map.of(
                        "type", "NOT",
                        "rule", Map.of(
                                "type", "LESS_THAN",
                                "left", Map.of("indicator", "ATR", "period", 5),
                                "right", 0.5
                        )
                )
        );

        DynamicStrategyParameters params = DynamicStrategyParameters.builder()
                .entryRule(entryRule)
                .exitRule(exitRule)
                .warmupBars(5)
                .build();

        Strategy strategy = factory.build(series, params);
        assertNotNull(strategy);
        assertNotNull(strategy.getEntryRule());
        assertNotNull(strategy.getExitRule());

        BarSeriesManager manager = new BarSeriesManager(series);
        TradingRecord record = manager.run(strategy);
        assertNotNull(record);
    }
}
