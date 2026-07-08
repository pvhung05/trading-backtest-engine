package com.trading.apps.metrics.calculator;

import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Calculates maximum consecutive losing trades.
 */
@Component
public class ConsecutiveLossesCalculator {

    /**
     * @param trades list of executed trades in chronological order (may be null or empty)
     * @return max count of consecutive trades with negative netProfit
     */
    public int calculate(List<ExecutedTrade> trades) {
        if (trades == null || trades.isEmpty()) {
            return 0;
        }
        int max = 0;
        int current = 0;
        for (ExecutedTrade t : trades) {
            if (t.getNetProfit() < 0.0) {
                current++;
                if (current > max) {
                    max = current;
                }
            } else {
                current = 0;
            }
        }
        return max;
    }
}
