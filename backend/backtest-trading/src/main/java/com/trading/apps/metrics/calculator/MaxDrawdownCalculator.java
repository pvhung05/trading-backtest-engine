package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.portfolio.model.EquityPoint;

/**
 * Calculates maximum drawdown from equity curve.
 * Max drawdown is the largest peak-to-trough decline as a percentage.
 */
@Component
public class MaxDrawdownCalculator {

    /**
     * @param equityCurve list of equity points (may be null or empty)
     * @return max drawdown as a positive percentage (e.g. 15.5 means -15.5%); 0.0 if flat or ascending
     */
    public double calculate(List<EquityPoint> equityCurve) {
        if (equityCurve == null || equityCurve.isEmpty()) {
            return 0.0;
        }
        double peak = Double.NEGATIVE_INFINITY;
        double maxDrawdown = 0.0;

        for (EquityPoint ep : equityCurve) {
            double equity = ep.getEquity();
            if (equity > peak) {
                peak = equity;
            }
            double drawdown = (peak - equity) / peak * 100.0;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        return BigDecimal.valueOf(maxDrawdown)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
