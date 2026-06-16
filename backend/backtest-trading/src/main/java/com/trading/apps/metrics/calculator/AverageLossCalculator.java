package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Calculates average loss (absolute value) of losing trades.
 */
@Component
public class AverageLossCalculator {

    /**
     * @param trades list of executed trades (may be null or empty)
     * @return average loss as a positive value; 0.0 if no losing trades
     */
    public double calculate(List<ExecutedTrade> trades) {
        if (trades == null || trades.isEmpty()) {
            return 0.0;
        }
        List<Double> losses = trades.stream()
                .filter(t -> t.getNetProfit() < 0.0)
                .mapToDouble(t -> Math.abs(t.getNetProfit()))
                .boxed()
                .toList();
        if (losses.isEmpty()) {
            return 0.0;
        }
        double avg = losses.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        return BigDecimal.valueOf(avg)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
