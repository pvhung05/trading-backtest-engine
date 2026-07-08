package com.trading.apps.metrics.calculator;

import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Calculates the worst (lowest) trade profit.
 */
@Component
public class WorstTradeCalculator {

    /**
     * @param trades list of executed trades (may be null or empty)
     * @return worst (most negative) trade net profit; 0.0 if no trades
     */
    public double calculate(List<ExecutedTrade> trades) {
        if (trades == null || trades.isEmpty()) {
            return 0.0;
        }
        return trades.stream()
                .mapToDouble(ExecutedTrade::getNetProfit)
                .min()
                .orElse(0.0);
    }
}
