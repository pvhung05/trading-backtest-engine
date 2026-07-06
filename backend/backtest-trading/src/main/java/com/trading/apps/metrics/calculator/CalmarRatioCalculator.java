package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.business.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.EquityPoint;

/**
 * Calculates Calmar Ratio: CAGR divided by max drawdown.
 */
@Component
public class CalmarRatioCalculator {

    private final CAGRCalculator cagrCalculator;
    private final MaxDrawdownCalculator maxDrawdownCalculator;

    public CalmarRatioCalculator(
            CAGRCalculator cagrCalculator,
            MaxDrawdownCalculator maxDrawdownCalculator) {
        this.cagrCalculator = cagrCalculator;
        this.maxDrawdownCalculator = maxDrawdownCalculator;
    }

    /**
     * @param initialCapital starting capital
     * @param finalBalance   ending balance
     * @param equityCurve    equity curve (used to derive duration)
     * @param trades         list of executed trades (may be null or empty)
     * @return Calmar Ratio; 0.0 if max drawdown is zero
     */
    public double calculate(
            double initialCapital,
            double finalBalance,
            List<EquityPoint> equityCurve,
            List<ExecutedTrade> trades) {

        double maxDrawdown = maxDrawdownCalculator.calculate(equityCurve);
        if (maxDrawdown == 0.0) {
            return 0.0;
        }
        double cagr = cagrCalculator.calculate(initialCapital, finalBalance, equityCurve, trades);
        return BigDecimal.valueOf(cagr / maxDrawdown)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
