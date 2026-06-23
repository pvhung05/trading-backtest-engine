package com.trading.apps.persistence.entity;

import java.math.BigDecimal;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import com.trading.apps.persistence.enums.TradeSide;

@Entity
@Table(name = "trade_records")
public class TradeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "backtest_run_id", nullable = false)
    private BacktestRun backtestRun;

    @Column(nullable = false)
    private int tradeNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TradeSide side = TradeSide.LONG;

    @Column(nullable = false)
    private Instant entryTime;

    @Column(nullable = false)
    private Instant exitTime;

    @Column(nullable = false, precision = 19, scale = 8)
    private BigDecimal entryPrice;

    @Column(nullable = false, precision = 19, scale = 8)
    private BigDecimal exitPrice;

    @Column(nullable = false, precision = 19, scale = 8)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 19, scale = 8)
    private BigDecimal grossProfit;

    @Column(nullable = false, precision = 19, scale = 8)
    private BigDecimal commission;

    @Column(nullable = false, precision = 19, scale = 8)
    private BigDecimal slippageCost;

    @Column(nullable = false, precision = 19, scale = 8)
    private BigDecimal netProfit;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal returnPercent;

    private Integer holdingPeriodBars;

    /** Maximum Favorable Excursion — max unrealized profit during the trade. */
    @Column(precision = 19, scale = 8)
    private BigDecimal maxFavorableExcursion;

    /** Maximum Adverse Excursion — max unrealized loss during the trade. */
    @Column(precision = 19, scale = 8)
    private BigDecimal maxAdverseExcursion;

    /** Cumulative PnL at the end of this trade. */
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal cumulativePnl;

    /** Trade size in USD (quantity * entryPrice). */
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal sizeUsd;

    /** Signal name that triggered the entry (e.g. "Long", "SMA Cross Up"). */
    @Column(length = 100)
    private String entrySignal;

    /** Signal name that triggered the exit (e.g. "Close Long", "SMA Cross Down"). */
    @Column(length = 100)
    private String exitSignal;

    protected TradeRecord() {
    }

    private TradeRecord(BacktestRun backtestRun, int tradeNumber, TradeSide side,
                        Instant entryTime, Instant exitTime,
                        BigDecimal entryPrice, BigDecimal exitPrice,
                        BigDecimal quantity, BigDecimal grossProfit,
                        BigDecimal commission, BigDecimal slippageCost,
                        BigDecimal netProfit, BigDecimal returnPercent, Integer holdingPeriodBars,
                        BigDecimal maxFavorableExcursion, BigDecimal maxAdverseExcursion,
                        BigDecimal cumulativePnl, BigDecimal sizeUsd,
                        String entrySignal, String exitSignal) {
        this.backtestRun = backtestRun;
        this.tradeNumber = tradeNumber;
        this.side = side;
        this.entryTime = entryTime;
        this.exitTime = exitTime;
        this.entryPrice = entryPrice;
        this.exitPrice = exitPrice;
        this.quantity = quantity;
        this.grossProfit = grossProfit;
        this.commission = commission;
        this.slippageCost = slippageCost;
        this.netProfit = netProfit;
        this.returnPercent = returnPercent;
        this.holdingPeriodBars = holdingPeriodBars;
        this.maxFavorableExcursion = maxFavorableExcursion;
        this.maxAdverseExcursion = maxAdverseExcursion;
        this.cumulativePnl = cumulativePnl;
        this.sizeUsd = sizeUsd;
        this.entrySignal = entrySignal;
        this.exitSignal = exitSignal;
    }

    public static TradeRecord of(BacktestRun backtestRun, int tradeNumber, TradeSide side,
                                  Instant entryTime, Instant exitTime,
                                  BigDecimal entryPrice, BigDecimal exitPrice,
                                  BigDecimal quantity, BigDecimal grossProfit,
                                  BigDecimal commission, BigDecimal slippageCost,
                                  BigDecimal netProfit, BigDecimal returnPercent, Integer holdingPeriodBars,
                                  BigDecimal maxFavorableExcursion, BigDecimal maxAdverseExcursion,
                                  BigDecimal cumulativePnl, BigDecimal sizeUsd,
                                  String entrySignal, String exitSignal) {
        return new TradeRecord(backtestRun, tradeNumber, side, entryTime, exitTime,
                entryPrice, exitPrice, quantity, grossProfit, commission,
                slippageCost, netProfit, returnPercent, holdingPeriodBars,
                maxFavorableExcursion, maxAdverseExcursion, cumulativePnl, sizeUsd,
                entrySignal, exitSignal);
    }

    public void setBacktestRun(BacktestRun backtestRun) {
        this.backtestRun = backtestRun;
    }

    // Getters

    public Long getId() {
        return id;
    }

    public BacktestRun getBacktestRun() {
        return backtestRun;
    }

    public int getTradeNumber() {
        return tradeNumber;
    }

    public TradeSide getSide() {
        return side;
    }

    public Instant getEntryTime() {
        return entryTime;
    }

    public Instant getExitTime() {
        return exitTime;
    }

    public BigDecimal getEntryPrice() {
        return entryPrice;
    }

    public BigDecimal getExitPrice() {
        return exitPrice;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public BigDecimal getGrossProfit() {
        return grossProfit;
    }

    public BigDecimal getCommission() {
        return commission;
    }

    public BigDecimal getSlippageCost() {
        return slippageCost;
    }

    public BigDecimal getNetProfit() {
        return netProfit;
    }

    public BigDecimal getReturnPercent() {
        return returnPercent;
    }

    public Integer getHoldingPeriodBars() {
        return holdingPeriodBars;
    }

    public BigDecimal getMaxFavorableExcursion() {
        return maxFavorableExcursion;
    }

    public BigDecimal getMaxAdverseExcursion() {
        return maxAdverseExcursion;
    }

    public BigDecimal getCumulativePnl() {
        return cumulativePnl;
    }

    public BigDecimal getSizeUsd() {
        return sizeUsd;
    }

    public String getEntrySignal() {
        return entrySignal;
    }

    public String getExitSignal() {
        return exitSignal;
    }
}
