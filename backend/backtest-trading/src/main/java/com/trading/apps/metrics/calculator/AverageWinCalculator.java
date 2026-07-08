package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Calculates average profit of winning trades.
 */
@Component
public class AverageWinCalculator {

    /**
     * @param trades list of executed trades (may be null or empty)
     * @return average win; 0.0 if no winning trades
     */
    public double calculate(List<ExecutedTrade> trades) {
        if (trades == null || trades.isEmpty()) {
            return 0.0;
        }
        List<Double> wins = trades.stream()
                .filter(t -> t.getNetProfit() > 0.0)
                .mapToDouble(ExecutedTrade::getNetProfit)
                .boxed()
                .toList();
        if (wins.isEmpty()) {
            return 0.0;
        }
        double avg = wins.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        return BigDecimal.valueOf(avg)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
