package com.trading.apps.execution.calculator;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class QuantityCalculatorTest {

    @Test
    void shouldCalculateQuantityFromCapitalAndPositionPercent() {
        QuantityCalculator calculator = new QuantityCalculator();

        double quantity = calculator.calculate(10_000.0d, 200.0d, 25.0d);

        assertEquals(12.5d, quantity, 1e-9);
    }

    @Test
    void shouldRejectNonPositiveEntryPrice() {
        QuantityCalculator calculator = new QuantityCalculator();

        assertThrows(IllegalArgumentException.class, () -> calculator.calculate(10_000.0d, 0.0d, 25.0d));
    }
}