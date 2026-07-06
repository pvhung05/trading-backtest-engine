package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.business.execution.model.ExecutedTrade;

/**
 * Calculates trade expectancy: expected net profit per trade.
 * Formula: (winRate * avgWin) - (lossRate * avgLoss)
 */
@Component
public class ExpectancyCalculator {

    private final WinRateCalculator winRateCalculator;
    private final AverageWinCalculator averageWinCalculator;
    private final AverageLossCalculator averageLossCalculator;

    public ExpectancyCalculator(
            WinRateCalculator winRateCalculator,
            AverageWinCalculator averageWinCalculator,
            AverageLossCalculator averageLossCalculator) {
        this.winRateCalculator = winRateCalculator;
        this.averageWinCalculator = averageWinCalculator;
        this.averageLossCalculator = averageLossCalculator;
    }

    /**
     * @param trades list of executed trades (may be null or empty)
     * @param totalTrades total number of trades
     * @return expectancy per trade
     */
    public double calculate(List<ExecutedTrade> trades, int totalTrades) {
        if (totalTrades == 0) {
            return 0.0;
        }
        double winRate = winRateCalculator.calculate(trades, totalTrades);
        double avgWin = averageWinCalculator.calculate(trades);
        double avgLoss = averageLossCalculator.calculate(trades);
        double expectancy = (winRate * avgWin) - ((1.0 - winRate) * avgLoss);
        return BigDecimal.valueOf(expectancy)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
