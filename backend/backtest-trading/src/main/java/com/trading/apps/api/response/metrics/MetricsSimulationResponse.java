package com.trading.apps.api.response.metrics;

/**
 * JSON DTO exposing all performance metrics from trades and equity curve.
 */
public record MetricsSimulationResponse(
        double initialCapital,
        double finalBalance,
        double totalReturnPercent,
        int totalTrades,
        int winningTrades,
        int losingTrades,
        double winRate,
        double profitFactor,
        double averageWin,
        double averageLoss,
        double bestTrade,
        double worstTrade,
        int maxConsecutiveWins,
        int maxConsecutiveLosses,
        double expectancy,
        double rewardRiskRatio,
        double maxDrawdown,
        double recoveryFactor,
        double sharpeRatio,
        double sortinoRatio,
        double calmarRatio,
        double cagr
) {
}
