package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Calculates total return percentage from initial capital and final balance.
 */
@Component
public class TotalReturnCalculator {

    /**
     * Calculates percentage return.
     *
     * @param initialCapital the starting capital
     * @param finalBalance  the ending balance
     * @return total return as a percentage (e.g. 15.5 means +15.5%)
     */
    public double calculate(double initialCapital, double finalBalance) {
        if (initialCapital == 0.0) {
            return 0.0;
        }
        return BigDecimal.valueOf((finalBalance - initialCapital) / initialCapital * 100.0)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /**
     * Calculates total return from a list of trades and initial capital.
     * Useful when final balance is not separately available.
     */
    public double calculateFromTrades(double initialCapital, List<ExecutedTrade> trades) {
        if (trades == null || trades.isEmpty()) {
            return 0.0;
        }
        double netProfit = trades.stream()
                .mapToDouble(ExecutedTrade::getNetProfit)
                .sum();
        double finalBalance = initialCapital + netProfit;
        return calculate(initialCapital, finalBalance);
    }
}
