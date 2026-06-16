package com.trading.apps.metrics.model;

/**
 * Raw trading statistics derived solely from executed trades.
 */
@lombok.Builder
@lombok.AllArgsConstructor
@lombok.NoArgsConstructor
@lombok.Getter
public class TradeStatistics {

    private int totalTrades;

    private int winningTrades;

    private int losingTrades;

    private double grossProfit;

    private double grossLoss;

    private double bestTrade;

    private double worstTrade;

    private int maxConsecutiveWins;

    private int maxConsecutiveLosses;

    private double expectancy;
}
