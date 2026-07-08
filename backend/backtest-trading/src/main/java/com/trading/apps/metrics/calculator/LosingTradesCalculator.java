package com.trading.apps.metrics.calculator;

import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Calculates number of losing (unprofitable) trades.
 */
@Component
public class LosingTradesCalculator {

    /**
     * @param trades list of executed trades (may be null or empty)
     * @return count of trades with netProfit less than zero
     */
    public int calculate(List<ExecutedTrade> trades) {
        if (trades == null) {
            return 0;
        }
        return (int) trades.stream()
                .filter(t -> t.getNetProfit() < 0.0)
                .count();
    }
}
