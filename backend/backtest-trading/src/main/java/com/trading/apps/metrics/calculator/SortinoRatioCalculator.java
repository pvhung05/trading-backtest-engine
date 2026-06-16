package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.portfolio.model.EquityPoint;

/**
 * Calculates Sortino Ratio from equity curve.
 * Uses downside deviation (only negative returns) instead of total std dev.
 * Formula: (mean return / downside deviation) * sqrt(252) [annualized]
 */
@Component
public class SortinoRatioCalculator {

    /**
     * @param equityCurve list of equity points (may be null or empty)
     * @return annualized Sortino Ratio; 0.0 if downside deviation is zero
     */
    public double calculate(List<EquityPoint> equityCurve) {
        List<Double> returns = computeReturns(equityCurve);
        if (returns.isEmpty()) {
            return 0.0;
        }
        double mean = returns.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double downsideVariance = returns.stream()
                .filter(r -> r < 0.0)
                .mapToDouble(r -> Math.pow(r, 2))
                .average()
                .orElse(0.0);
        double downsideDeviation = Math.sqrt(downsideVariance);
        if (downsideDeviation == 0.0) {
            return 0.0;
        }
        double sortino = (mean / downsideDeviation) * Math.sqrt(252.0);
        return BigDecimal.valueOf(sortino)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }

    List<Double> computeReturns(List<EquityPoint> equityCurve) {
        if (equityCurve == null || equityCurve.size() < 2) {
            return List.of();
        }
        List<Double> returns = new ArrayList<>();
        for (int i = 1; i < equityCurve.size(); i++) {
            double prevEquity = equityCurve.get(i - 1).getEquity();
            double currEquity = equityCurve.get(i).getEquity();
            if (prevEquity != 0.0) {
                returns.add((currEquity - prevEquity) / prevEquity);
            }
        }
        return returns;
    }
}
