package com.trading.mapper;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Component;

import com.trading.model.MetricsResult;
import com.trading.model.BacktestRun;
import com.trading.model.MetricsSnapshot;

@Component
public class MetricsSnapshotMapper {

    private static final int SCALE = 4;

    public MetricsSnapshot toEntity(BacktestRun backtestRun, MetricsResult metrics) {
        return MetricsSnapshot.of(backtestRun,
                toBigDecimal(metrics.getInitialCapital(), SCALE),
                toBigDecimal(metrics.getFinalBalance(), SCALE),
                toBigDecimal(metrics.getTotalReturnPercent(), SCALE),
                metrics.getTotalTrades(),
                metrics.getWinningTrades(),
                metrics.getLosingTrades(),
                toBigDecimal(metrics.getWinRate(), SCALE),
                toBigDecimal(metrics.getProfitFactor(), SCALE),
                toBigDecimal(metrics.getAverageWin(), SCALE),
                toBigDecimal(metrics.getAverageLoss(), SCALE),
                toBigDecimal(metrics.getBestTrade(), SCALE),
                toBigDecimal(metrics.getWorstTrade(), SCALE),
                metrics.getMaxConsecutiveWins(),
                metrics.getMaxConsecutiveLosses(),
                toBigDecimal(metrics.getExpectancy(), SCALE),
                toBigDecimal(metrics.getRewardRiskRatio(), SCALE),
                toBigDecimal(metrics.getMaxDrawdown(), SCALE),
                toBigDecimal(metrics.getRecoveryFactor(), SCALE),
                toBigDecimal(metrics.getSharpeRatio(), SCALE),
                toBigDecimal(metrics.getSortinoRatio(), SCALE),
                toBigDecimal(metrics.getCalmarRatio(), SCALE),
                toBigDecimal(metrics.getCagr(), SCALE));
    }

    private BigDecimal toBigDecimal(double val, int scale) {
        if (Double.isNaN(val) || Double.isInfinite(val)) {
            return BigDecimal.ZERO.setScale(scale, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(val).setScale(scale, RoundingMode.HALF_UP);
    }
}

