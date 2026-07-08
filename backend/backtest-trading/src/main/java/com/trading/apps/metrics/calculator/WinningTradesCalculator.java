package com.trading.apps.metrics.calculator;

import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Calculates number of winning (profitable) trades.
 */
@Component
public class WinningTradesCalculator {

    /**
     * @param trades list of executed trades (may be null or empty)
     * @return count of trades with netProfit greater than zero
     */
    public int calculate(List<ExecutedTrade> trades) {
        if (trades == null) {
            return 0;
        }
        return (int) trades.stream()
                .filter(t -> t.getNetProfit() > 0.0)
                .count();
    }
}
