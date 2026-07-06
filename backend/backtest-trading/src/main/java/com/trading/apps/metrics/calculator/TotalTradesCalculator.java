package com.trading.apps.metrics.calculator;

import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.business.execution.model.ExecutedTrade;

/**
 * Calculates total number of executed trades.
 */
@Component
public class TotalTradesCalculator {

    /**
     * @param trades list of executed trades (may be null or empty)
     * @return number of trades
     */
    public int calculate(List<ExecutedTrade> trades) {
        if (trades == null) {
            return 0;
        }
        return trades.size();
    }
}
