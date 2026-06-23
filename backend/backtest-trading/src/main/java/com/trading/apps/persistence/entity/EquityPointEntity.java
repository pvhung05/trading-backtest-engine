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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "equity_points")
public class EquityPointEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "backtest_run_id", nullable = false)
    private BacktestRun backtestRun;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal equity;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal cash;

    @Column(precision = 19, scale = 4)
    private BigDecimal openPositionPnl;

    @Column(nullable = false)
    private int tradeNumber;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected EquityPointEntity() {
    }

    private EquityPointEntity(BacktestRun backtestRun, Instant timestamp,
                              BigDecimal equity, BigDecimal cash,
                              BigDecimal openPositionPnl, int tradeNumber) {
        this.backtestRun = backtestRun;
        this.timestamp = timestamp;
        this.equity = equity;
        this.cash = cash;
        this.openPositionPnl = openPositionPnl;
        this.tradeNumber = tradeNumber;
    }

    public static EquityPointEntity of(BacktestRun backtestRun, Instant timestamp,
                                        BigDecimal equity, BigDecimal cash,
                                        BigDecimal openPositionPnl, int tradeNumber) {
        return new EquityPointEntity(backtestRun, timestamp, equity, cash, openPositionPnl, tradeNumber);
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

    public Instant getTimestamp() {
        return timestamp;
    }

    public BigDecimal getEquity() {
        return equity;
    }

    public BigDecimal getCash() {
        return cash;
    }

    public BigDecimal getOpenPositionPnl() {
        return openPositionPnl;
    }

    public int getTradeNumber() {
        return tradeNumber;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
