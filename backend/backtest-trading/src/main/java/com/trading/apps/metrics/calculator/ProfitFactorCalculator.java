package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.business.execution.model.ExecutedTrade;

/**
 * Calculates profit factor: gross profit divided by gross loss.
 */
@Component
public class ProfitFactorCalculator {

    /**
     * @param trades list of executed trades (may be null or empty)
     * @return profit factor; 0.0 if gross loss is zero or no trades
     */
    public double calculate(List<ExecutedTrade> trades) {
        if (trades == null || trades.isEmpty()) {
            return 0.0;
        }
        double grossProfit = trades.stream()
                .filter(t -> t.getNetProfit() > 0.0)
                .mapToDouble(ExecutedTrade::getNetProfit)
                .sum();
        double grossLoss = Math.abs(trades.stream()
                .filter(t -> t.getNetProfit() < 0.0)
                .mapToDouble(ExecutedTrade::getNetProfit)
                .sum());
        if (grossLoss == 0.0) {
            return grossProfit > 0.0 ? Double.POSITIVE_INFINITY : 0.0;
        }
        return BigDecimal.valueOf(grossProfit / grossLoss)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
