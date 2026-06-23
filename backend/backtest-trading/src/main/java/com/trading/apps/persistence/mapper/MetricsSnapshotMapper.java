package com.trading.apps.persistence.mapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

import org.springframework.stereotype.Component;

import com.trading.apps.metrics.model.MetricsResult;
import com.trading.apps.persistence.entity.BacktestRun;
import com.trading.apps.persistence.entity.MetricsSnapshot;

@Component
public class MetricsSnapshotMapper {

    private static final int SCALE = 4;

    public MetricsSnapshot toEntity(BacktestRun backtestRun, MetricsResult metrics) {
        return MetricsSnapshot.of(backtestRun,
                BigDecimal.valueOf(metrics.getInitialCapital()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getFinalBalance()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getTotalReturnPercent()).setScale(SCALE, RoundingMode.HALF_UP),
                metrics.getTotalTrades(),
                metrics.getWinningTrades(),
                metrics.getLosingTrades(),
                BigDecimal.valueOf(metrics.getWinRate()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getProfitFactor()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getAverageWin()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getAverageLoss()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getBestTrade()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getWorstTrade()).setScale(SCALE, RoundingMode.HALF_UP),
                metrics.getMaxConsecutiveWins(),
                metrics.getMaxConsecutiveLosses(),
                BigDecimal.valueOf(metrics.getExpectancy()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getRewardRiskRatio()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getMaxDrawdown()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getRecoveryFactor()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getSharpeRatio()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getSortinoRatio()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getCalmarRatio()).setScale(SCALE, RoundingMode.HALF_UP),
                BigDecimal.valueOf(metrics.getCagr()).setScale(SCALE, RoundingMode.HALF_UP));
    }
}
