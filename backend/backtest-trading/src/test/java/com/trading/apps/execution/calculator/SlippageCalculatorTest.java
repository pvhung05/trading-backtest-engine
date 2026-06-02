package com.trading.apps.execution.calculator;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class SlippageCalculatorTest {

    @Test
    void shouldApplyBuySlippage() {
        SlippageCalculator calculator = new SlippageCalculator();

        double slippedPrice = calculator.applyBuy(100.0d, 0.01d);

        assertEquals(101.0d, slippedPrice, 1e-9);
    }

    @Test
    void shouldApplySellSlippage() {
        SlippageCalculator calculator = new SlippageCalculator();

        double slippedPrice = calculator.applySell(100.0d, 0.01d);

        assertEquals(99.0d, slippedPrice, 1e-9);
    }
}