package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.business.execution.model.ExecutedTrade;

/**
 * Calculates the best (highest) trade profit.
 */
@Component
public class BestTradeCalculator {

    /**
     * @param trades list of executed trades (may be null or empty)
     * @return best trade net profit; 0.0 if no trades
     */
    public double calculate(List<ExecutedTrade> trades) {
        if (trades == null || trades.isEmpty()) {
            return 0.0;
        }
        return trades.stream()
                .mapToDouble(ExecutedTrade::getNetProfit)
                .max()
                .orElse(0.0);
    }
}
