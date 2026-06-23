package com.trading.apps.persistence.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import com.trading.apps.auth.entity.AppUser;
import com.trading.apps.persistence.enums.BacktestStatus;
import com.trading.apps.strategy.enums.StrategyType;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "backtest_runs")
public class BacktestRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private StrategyType strategyType;

    @Column(columnDefinition = "JSON")
    private String strategyParams;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false, length = 10)
    private String timeframe;

    @Column(nullable = false)
    private Instant startTime;

    @Column(nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BacktestStatus status = BacktestStatus.COMPLETED;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Long executionDurationMs;

    @OneToMany(mappedBy = "backtestRun", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @OrderBy("tradeNumber ASC")
    private List<TradeRecord> trades = new ArrayList<>();

    @OneToOne(mappedBy = "backtestRun", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private MetricsSnapshot metrics;

    @OneToMany(mappedBy = "backtestRun", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @OrderBy("timestamp ASC, id ASC")
    private List<EquityPointEntity> equityPoints = new ArrayList<>();

    protected BacktestRun() {
    }

    private BacktestRun(AppUser user, StrategyType strategyType, String strategyParams,
                        String symbol, String timeframe, Instant startTime, Instant endTime) {
        this.user = user;
        this.strategyType = strategyType;
        this.strategyParams = strategyParams;
        this.symbol = symbol;
        this.timeframe = timeframe;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public static BacktestRun of(AppUser user, StrategyType strategyType, String strategyParams,
                                 String symbol, String timeframe, Instant startTime, Instant endTime) {
        return new BacktestRun(user, strategyType, strategyParams, symbol, timeframe, startTime, endTime);
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public void addTrade(TradeRecord trade) {
        trade.setBacktestRun(this);
        this.trades.add(trade);
    }

    public void addEquityPoint(EquityPointEntity point) {
        point.setBacktestRun(this);
        this.equityPoints.add(point);
    }

    public void setMetrics(MetricsSnapshot metrics) {
        metrics.setBacktestRun(this);
        this.metrics = metrics;
    }

    // Getters and setters

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public StrategyType getStrategyType() {
        return strategyType;
    }

    public String getStrategyParams() {
        return strategyParams;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getTimeframe() {
        return timeframe;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public BacktestStatus getStatus() {
        return status;
    }

    public void setStatus(BacktestStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Long getExecutionDurationMs() {
        return executionDurationMs;
    }

    public void setExecutionDurationMs(Long executionDurationMs) {
        this.executionDurationMs = executionDurationMs;
    }

    public List<TradeRecord> getTrades() {
        return trades;
    }

    public MetricsSnapshot getMetrics() {
        return metrics;
    }

    public List<EquityPointEntity> getEquityPoints() {
        return equityPoints;
    }
}
