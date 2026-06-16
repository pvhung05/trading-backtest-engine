package com.trading.apps.metrics.model;

/**
 * Immutable result of metrics calculation containing both trading and portfolio statistics.
 */
@lombok.Getter
@lombok.Builder
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
public class MetricsResult {

    private double initialCapital;

    private double finalBalance;

    private double totalReturnPercent;

    private int totalTrades;

    private int winningTrades;

    private int losingTrades;

    private double winRate;

    private double profitFactor;

    private double averageWin;

    private double averageLoss;

    private double bestTrade;

    private double worstTrade;

    private int maxConsecutiveWins;

    private int maxConsecutiveLosses;

    private double expectancy;

    private double rewardRiskRatio;

    private double maxDrawdown;

    private double recoveryFactor;

    private double sharpeRatio;

    private double sortinoRatio;

    private double calmarRatio;

    private double cagr;
}
