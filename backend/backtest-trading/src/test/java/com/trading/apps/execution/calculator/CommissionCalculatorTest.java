package com.trading.apps.execution.calculator;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class CommissionCalculatorTest {

    @Test
    void shouldCalculateCommissionFromTradeValue() {
        CommissionCalculator calculator = new CommissionCalculator();

        double commission = calculator.calculate(1_000.0d, 0.001d);

        assertEquals(1.0d, commission, 1e-9);
    }
}