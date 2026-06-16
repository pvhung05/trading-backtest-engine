package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.portfolio.model.EquityPoint;

/**
 * Calculates Sharpe Ratio from equity curve returns.
 * Uses a risk-free rate of 0% for simplicity.
 * Formula: (mean return / std dev of returns) * sqrt(252) [annualized]
 */
@Component
public class SharpeRatioCalculator {

    /**
     * @param equityCurve list of equity points (may be null or empty)
     * @return annualized Sharpe Ratio; 0.0 if standard deviation is zero
     */
    public double calculate(List<EquityPoint> equityCurve) {
        List<Double> returns = computeReturns(equityCurve);
        if (returns.isEmpty()) {
            return 0.0;
        }
        double mean = returns.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double variance = returns.stream()
                .mapToDouble(r -> Math.pow(r - mean, 2))
                .average()
                .orElse(0.0);
        double stdDev = Math.sqrt(variance);
        if (stdDev == 0.0) {
            return 0.0;
        }
        double sharpe = (mean / stdDev) * Math.sqrt(252.0);
        return BigDecimal.valueOf(sharpe)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /**
     * Computes simple periodic returns from equity curve.
     */
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
