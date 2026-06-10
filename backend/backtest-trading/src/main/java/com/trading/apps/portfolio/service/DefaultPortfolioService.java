package com.trading.apps.portfolio.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.EquityPoint;
import com.trading.apps.portfolio.model.Portfolio;
import com.trading.apps.portfolio.model.PortfolioConfig;
import com.trading.apps.portfolio.model.PortfolioResult;
import com.trading.apps.portfolio.model.PortfolioSnapshot;
import com.trading.apps.portfolio.validator.PortfolioValidator;

/**
 * Default implementation of {@link PortfolioService}.
 */
@Service
public class DefaultPortfolioService implements PortfolioService {

    private final PortfolioValidator validator;

    public DefaultPortfolioService(PortfolioValidator validator) {
        this.validator = Objects.requireNonNull(validator, "validator cannot be null");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PortfolioResult calculate(List<ExecutedTrade> trades, PortfolioConfig config) {
        validator.validate(trades, config);

        if (trades == null) {
            trades = Collections.emptyList();
        }

        double cash = config.getInitialCapital();
        double balance = config.getInitialCapital();

        List<PortfolioSnapshot> snapshots = new ArrayList<>();
        List<EquityPoint> equityCurve = new ArrayList<>();

        // initial equity point
        equityCurve.add(EquityPoint.builder()
                .timestamp(null)
                .equity(config.getInitialCapital())
                .build());

        int tradeIndex = 0;
        for (ExecutedTrade trade : trades) {
            tradeIndex += 1;

            double netProfit = trade == null ? 0.0d : trade.getNetProfit();
            cash += netProfit;
            balance = cash;

            PortfolioSnapshot snapshot = PortfolioSnapshot.builder()
                    .timestamp(trade == null ? null : trade.getExitTime())
                    .balance(balance)
                    .cash(cash)
                    .tradeProfit(netProfit)
                    .tradeNumber(tradeIndex)
                    .build();

            snapshots.add(snapshot);

            EquityPoint point = EquityPoint.builder()
                    .timestamp(trade == null ? null : trade.getExitTime())
                    .equity(balance)
                    .build();

            equityCurve.add(point);
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
}
