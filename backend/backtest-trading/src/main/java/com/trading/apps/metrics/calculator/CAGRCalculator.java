package com.trading.apps.metrics.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Component;

import com.trading.apps.business.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.EquityPoint;

/**
 * Calculates Compound Annual Growth Rate from initial capital, final balance, and backtest duration.
 * Formula: ((finalBalance / initialCapital)^(1/years)) - 1
 */
@Component
public class CAGRCalculator {

    /**
     * @param initialCapital starting capital
     * @param finalBalance   ending balance
     * @param equityCurve    equity curve (used to determine duration from first/last timestamp)
     * @param trades         list of executed trades (may be null or empty)
     * @return CAGR as a percentage (e.g. 25.0 means 25% per year)
     */
    public double calculate(
            double initialCapital,
            double finalBalance,
            List<EquityPoint> equityCurve,
            List<ExecutedTrade> trades) {

        if (initialCapital == 0.0 || finalBalance == 0.0) {
            return 0.0;
        }

        long days = computeBacktestDays(equityCurve, trades);
        if (days <= 0) {
            return 0.0;
        }

        double years = days / 365.0;
        double ratio = finalBalance / initialCapital;

        double cagr = (Math.pow(ratio, 1.0 / years) - 1) * 100.0;
        return BigDecimal.valueOf(cagr)
                .setScale(6, RoundingMode.HALF_UP)
                .doubleValue();
    }

    long computeBacktestDays(List<EquityPoint> equityCurve, List<ExecutedTrade> trades) {
        Instant start = null;
        Instant end = null;

        if (equityCurve != null && !equityCurve.isEmpty()) {
            start = equityCurve.get(0).getTimestamp();
            end = equityCurve.get(equityCurve.size() - 1).getTimestamp();
        } else if (trades != null && !trades.isEmpty()) {
            start = trades.stream()
                    .map(ExecutedTrade::getEntryTime)
                    .min(Instant::compareTo)
                    .orElse(null);
            end = trades.stream()
                    .map(ExecutedTrade::getExitTime)
                    .max(Instant::compareTo)
                    .orElse(null);
        }

        if (start == null || end == null) {
            return 0;
        }
        return Duration.between(start, end).toDays();
    }
}
