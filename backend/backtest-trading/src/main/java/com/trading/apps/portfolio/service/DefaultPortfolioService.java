package com.trading.apps.portfolio.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;

import com.trading.apps.business.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.EquityPoint;
import com.trading.apps.portfolio.model.Portfolio;
import com.trading.apps.portfolio.model.PortfolioConfig;
import com.trading.apps.portfolio.model.PortfolioResult;
import com.trading.apps.portfolio.model.PortfolioSnapshot;
import com.trading.apps.portfolio.validator.PortfolioValidator;

/**
 * Default implementation of {@link PortfolioService}.
 * Calculates portfolio equity at every candle bar using mark-to-market.
 */
@Service
public class DefaultPortfolioService implements PortfolioService {

    private final PortfolioValidator validator;

    public DefaultPortfolioService(PortfolioValidator validator) {
        this.validator = Objects.requireNonNull(validator, "validator cannot be null");
    }

    @Override
    public PortfolioResult calculate(List<ExecutedTrade> trades, BarSeries series,
            PortfolioConfig config, int warmupBars) {
        validator.validate(trades, series, config);

        if (trades == null) {
            trades = Collections.emptyList();
        }

        int barCount = series.getBarCount();
        if (warmupBars < 0) warmupBars = 0;
        if (warmupBars >= barCount) warmupBars = barCount - 1;

        // Index trades by their entry/exit bar index for O(1) lookup; only trades
        // whose entire lifecycle is visible in the simulation window are considered
        Map<Integer, ExecutedTrade> tradesByEntryIndex = new HashMap<>();
        Map<Integer, ExecutedTrade> tradesByExitIndex = new HashMap<>();

        for (ExecutedTrade trade : trades) {
            int entryIdx = findBarIndex(series, trade.getEntryTime());
            int exitIdx = findBarIndex(series, trade.getExitTime());

            // Skip trades that open or close before the simulation window starts
            if (entryIdx < warmupBars || exitIdx < warmupBars) {
                continue;
            }
            if (entryIdx >= 0 && entryIdx < barCount) {
                tradesByEntryIndex.put(entryIdx, trade);
            }
            if (exitIdx >= 0 && exitIdx < barCount) {
                tradesByExitIndex.put(exitIdx, trade);
            }
        }

        double cash = config.getInitialCapital();
        double balance = config.getInitialCapital();
        double positionQty = 0.0;
        double entryPrice = 0.0;
        int tradeNumber = 0;

        List<PortfolioSnapshot> snapshots = new ArrayList<>();
        List<EquityPoint> equityCurve = new ArrayList<>();

        for (int i = warmupBars; i < barCount; i++) {
            Bar bar = series.getBar(i);
            double close = bar.getClosePrice().doubleValue();
            var ts = bar.getEndTime();

            // Mark-to-market: update balance based on open position
            if (positionQty > 0) {
                double unrealizedPnl = (close - entryPrice) * positionQty;
                balance = cash + unrealizedPnl;
            } else {
                balance = cash;
            }

            boolean isOpen = positionQty > 0;
            double openPnl = isOpen ? (close - entryPrice) * positionQty : 0.0;

            equityCurve.add(EquityPoint.builder()
                    .timestamp(ts)
                    .equity(balance)
                    .openPosition(isOpen)
                    .openPositionPnl(openPnl)
                    .build());

            ExecutedTrade exitTrade = tradesByExitIndex.get(i);
            if (exitTrade != null) {
                tradeNumber++;
                double netProfit = exitTrade.getNetProfit();
                cash += netProfit;
                positionQty = 0.0;
                entryPrice = 0.0;
                balance = cash;

                snapshots.add(PortfolioSnapshot.builder()
                        .timestamp(ts)
                        .balance(balance)
                        .cash(cash)
                        .tradeProfit(netProfit)
                        .tradeNumber(tradeNumber)
                        .build());
            }

            ExecutedTrade entryTrade = tradesByEntryIndex.get(i);
            if (entryTrade != null && positionQty == 0) {
                positionQty = entryTrade.getQuantity();
                entryPrice = entryTrade.getEntryPrice();
            }
        }

        // If still holding a position at the end, close it at final close price
        if (positionQty > 0 && barCount > 0) {
            double finalClose = series.getBar(barCount - 1).getClosePrice().doubleValue();
            double unrealizedPnl = (finalClose - entryPrice) * positionQty;
            cash += unrealizedPnl;
            balance = cash;
            positionQty = 0.0;

            equityCurve.add(EquityPoint.builder()
                    .timestamp(series.getBar(barCount - 1).getEndTime())
                    .equity(balance)
                    .openPosition(false)
                    .openPositionPnl(0.0)
                    .build());
        }

        Portfolio portfolio = Portfolio.builder()
                .initialCapital(config.getInitialCapital())
                .currentBalance(balance)
                .currentCash(cash)
                .build();

        return PortfolioResult.builder()
                .portfolio(portfolio)
                .snapshots(snapshots)
                .equityCurve(equityCurve)
                .build();
    }

    /**
     * Finds the bar index whose end time is on or immediately after the given instant.
     */
    private int findBarIndex(BarSeries series, java.time.Instant instant) {
        if (instant == null || series.getBarCount() == 0) {
            return -1;
        }
        int barCount = series.getBarCount();
        for (int i = 0; i < barCount; i++) {
            var barEndTime = series.getBar(i).getEndTime();
            if (barEndTime.equals(instant) || barEndTime.isAfter(instant)) {
                return i;
            }
        }
        return barCount - 1;
    }
}
