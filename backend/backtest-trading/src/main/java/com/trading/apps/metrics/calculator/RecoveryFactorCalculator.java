package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.business.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.EquityPoint;

/**
 * Calculates recovery factor: net profit divided by max drawdown.
 */
@Component
public class RecoveryFactorCalculator {

    private final MaxDrawdownCalculator maxDrawdownCalculator;

    public RecoveryFactorCalculator(MaxDrawdownCalculator maxDrawdownCalculator) {
        this.maxDrawdownCalculator = maxDrawdownCalculator;
    }

    /**
     * @param trades list of executed trades (may be null or empty)
     * @param equityCurve equity curve (may be null or empty)
     * @return recovery factor; 0.0 if max drawdown is zero or no trades
     */
    public double calculate(List<ExecutedTrade> trades, List<EquityPoint> equityCurve) {
        if (trades == null || trades.isEmpty()) {
            return 0.0;
        }
        double netProfit = trades.stream()
                .mapToDouble(ExecutedTrade::getNetProfit)
                .sum();
        if (netProfit <= 0.0) {
            return 0.0;
        }
        double maxDrawdown = maxDrawdownCalculator.calculate(equityCurve);
        if (maxDrawdown == 0.0) {
            return Double.POSITIVE_INFINITY;
        }
        return BigDecimal.valueOf(netProfit / maxDrawdown)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
