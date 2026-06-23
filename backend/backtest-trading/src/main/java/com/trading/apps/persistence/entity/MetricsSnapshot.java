package com.trading.apps.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "metrics_snapshots")
public class MetricsSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "backtest_run_id", nullable = false, unique = true)
    private BacktestRun backtestRun;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal initialCapital;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal finalBalance;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal totalReturnPercent;

    @Column(nullable = false)
    private int totalTrades;

    @Column(nullable = false)
    private int winningTrades;

    @Column(nullable = false)
    private int losingTrades;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal winRate;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal profitFactor;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal averageWin;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal averageLoss;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal bestTrade;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal worstTrade;

    @Column(nullable = false)
    private int maxConsecutiveWins;

    @Column(nullable = false)
    private int maxConsecutiveLosses;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal expectancy;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal rewardRiskRatio;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal maxDrawdown;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal recoveryFactor;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal sharpeRatio;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal sortinoRatio;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal calmarRatio;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal cagr;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected MetricsSnapshot() {
    }

    private MetricsSnapshot(BacktestRun backtestRun,
                            BigDecimal initialCapital, BigDecimal finalBalance,
                            BigDecimal totalReturnPercent, int totalTrades,
                            int winningTrades, int losingTrades,
                            BigDecimal winRate, BigDecimal profitFactor,
                            BigDecimal averageWin, BigDecimal averageLoss,
                            BigDecimal bestTrade, BigDecimal worstTrade,
                            int maxConsecutiveWins, int maxConsecutiveLosses,
                            BigDecimal expectancy, BigDecimal rewardRiskRatio,
                            BigDecimal maxDrawdown, BigDecimal recoveryFactor,
                            BigDecimal sharpeRatio, BigDecimal sortinoRatio,
                            BigDecimal calmarRatio, BigDecimal cagr) {
        this.backtestRun = backtestRun;
        this.initialCapital = initialCapital;
        this.finalBalance = finalBalance;
        this.totalReturnPercent = totalReturnPercent;
        this.totalTrades = totalTrades;
        this.winningTrades = winningTrades;
        this.losingTrades = losingTrades;
        this.winRate = winRate;
        this.profitFactor = profitFactor;
        this.averageWin = averageWin;
        this.averageLoss = averageLoss;
        this.bestTrade = bestTrade;
        this.worstTrade = worstTrade;
        this.maxConsecutiveWins = maxConsecutiveWins;
        this.maxConsecutiveLosses = maxConsecutiveLosses;
        this.expectancy = expectancy;
        this.rewardRiskRatio = rewardRiskRatio;
        this.maxDrawdown = maxDrawdown;
        this.recoveryFactor = recoveryFactor;
        this.sharpeRatio = sharpeRatio;
        this.sortinoRatio = sortinoRatio;
        this.calmarRatio = calmarRatio;
        this.cagr = cagr;
    }

    public static MetricsSnapshot of(BacktestRun backtestRun,
                                     BigDecimal initialCapital, BigDecimal finalBalance,
                                     BigDecimal totalReturnPercent, int totalTrades,
                                     int winningTrades, int losingTrades,
                                     BigDecimal winRate, BigDecimal profitFactor,
                                     BigDecimal averageWin, BigDecimal averageLoss,
                                     BigDecimal bestTrade, BigDecimal worstTrade,
                                     int maxConsecutiveWins, int maxConsecutiveLosses,
                                     BigDecimal expectancy, BigDecimal rewardRiskRatio,
                                     BigDecimal maxDrawdown, BigDecimal recoveryFactor,
                                     BigDecimal sharpeRatio, BigDecimal sortinoRatio,
                                     BigDecimal calmarRatio, BigDecimal cagr) {
        return new MetricsSnapshot(backtestRun, initialCapital, finalBalance,
                totalReturnPercent, totalTrades, winningTrades, losingTrades,
                winRate, profitFactor, averageWin, averageLoss, bestTrade, worstTrade,
                maxConsecutiveWins, maxConsecutiveLosses, expectancy, rewardRiskRatio,
                maxDrawdown, recoveryFactor, sharpeRatio, sortinoRatio, calmarRatio, cagr);
    }

    public void setBacktestRun(BacktestRun backtestRun) {
        this.backtestRun = backtestRun;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    // Getters

    public Long getId() {
        return id;
    }

    public BacktestRun getBacktestRun() {
        return backtestRun;
    }

    public BigDecimal getInitialCapital() {
        return initialCapital;
    }

    public BigDecimal getFinalBalance() {
        return finalBalance;
    }

    public BigDecimal getTotalReturnPercent() {
        return totalReturnPercent;
    }

    public int getTotalTrades() {
        return totalTrades;
    }

    public int getWinningTrades() {
        return winningTrades;
    }

    public int getLosingTrades() {
        return losingTrades;
    }

    public BigDecimal getWinRate() {
        return winRate;
    }

    public BigDecimal getProfitFactor() {
        return profitFactor;
    }

    public BigDecimal getAverageWin() {
        return averageWin;
    }

    public BigDecimal getAverageLoss() {
        return averageLoss;
    }

    public BigDecimal getBestTrade() {
        return bestTrade;
    }

    public BigDecimal getWorstTrade() {
        return worstTrade;
    }

    public int getMaxConsecutiveWins() {
        return maxConsecutiveWins;
    }

    public int getMaxConsecutiveLosses() {
        return maxConsecutiveLosses;
    }

    public BigDecimal getExpectancy() {
        return expectancy;
    }

    public BigDecimal getRewardRiskRatio() {
        return rewardRiskRatio;
    }

    public BigDecimal getMaxDrawdown() {
        return maxDrawdown;
    }

    public BigDecimal getRecoveryFactor() {
        return recoveryFactor;
    }

    public BigDecimal getSharpeRatio() {
        return sharpeRatio;
    }

    public BigDecimal getSortinoRatio() {
        return sortinoRatio;
    }

    public BigDecimal getCalmarRatio() {
        return calmarRatio;
    }

    public BigDecimal getCagr() {
        return cagr;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
