package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Calculates reward-to-risk ratio: average win divided by average loss.
 */
@Component
public class RewardRiskRatioCalculator {

    private final AverageWinCalculator averageWinCalculator;
    private final AverageLossCalculator averageLossCalculator;

    public RewardRiskRatioCalculator(
            AverageWinCalculator averageWinCalculator,
            AverageLossCalculator averageLossCalculator) {
        this.averageLossCalculator = averageLossCalculator;
        this.averageWinCalculator = averageWinCalculator;
    }

    /**
     * @param trades list of executed trades (may be null or empty)
     * @return reward risk ratio; 0.0 if no losing trades
     */
    public double calculate(List<ExecutedTrade> trades) {
        double avgLoss = averageLossCalculator.calculate(trades);
        if (avgLoss == 0.0) {
            return 0.0;
        }
        double avgWin = averageWinCalculator.calculate(trades);
        if (avgWin == 0.0) {
            return 0.0;
        }
        return BigDecimal.valueOf(avgWin / avgLoss)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
