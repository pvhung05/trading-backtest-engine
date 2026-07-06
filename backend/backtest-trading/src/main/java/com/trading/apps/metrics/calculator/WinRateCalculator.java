package com.trading.apps.metrics.calculator;

import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.business.execution.model.ExecutedTrade;

/**
 * Calculates win rate: winning trades divided by total trades.
 */
@Component
public class WinRateCalculator {

    /**
     * @param trades list of executed trades (may be null or empty)
     * @param totalTrades total number of trades
     * @return win rate as a decimal (e.g. 0.55 means 55%)
     */
    public double calculate(List<ExecutedTrade> trades, int totalTrades) {
        if (totalTrades == 0) {
            return 0.0;
        }
        long winningCount = 0L;
        if (trades != null) {
            winningCount = trades.stream()
                    .filter(t -> t.getNetProfit() > 0.0)
                    .count();
        }
        return (double) winningCount / totalTrades;
    }
}
