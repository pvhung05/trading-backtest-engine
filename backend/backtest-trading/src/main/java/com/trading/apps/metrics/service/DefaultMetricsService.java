package com.trading.apps.metrics.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.trading.apps.business.execution.model.ExecutedTrade;
import com.trading.apps.metrics.calculator.AverageLossCalculator;
import com.trading.apps.metrics.calculator.AverageWinCalculator;
import com.trading.apps.metrics.calculator.BestTradeCalculator;
import com.trading.apps.metrics.calculator.CalmarRatioCalculator;
import com.trading.apps.metrics.calculator.CAGRCalculator;
import com.trading.apps.metrics.calculator.ConsecutiveLossesCalculator;
import com.trading.apps.metrics.calculator.ConsecutiveWinsCalculator;
import com.trading.apps.metrics.calculator.ExpectancyCalculator;
import com.trading.apps.metrics.calculator.LosingTradesCalculator;
import com.trading.apps.metrics.calculator.MaxDrawdownCalculator;
import com.trading.apps.metrics.calculator.ProfitFactorCalculator;
import com.trading.apps.metrics.calculator.RecoveryFactorCalculator;
import com.trading.apps.metrics.calculator.RewardRiskRatioCalculator;
import com.trading.apps.metrics.calculator.SharpeRatioCalculator;
import com.trading.apps.metrics.calculator.SortinoRatioCalculator;
import com.trading.apps.metrics.calculator.TotalReturnCalculator;
import com.trading.apps.metrics.calculator.TotalTradesCalculator;
import com.trading.apps.metrics.calculator.WinningTradesCalculator;
import com.trading.apps.metrics.calculator.WorstTradeCalculator;
import com.trading.apps.metrics.calculator.WinRateCalculator;
import com.trading.apps.metrics.model.MetricsResult;
import com.trading.apps.metrics.validator.MetricsValidator;
import com.trading.apps.portfolio.model.EquityPoint;
import com.trading.apps.portfolio.model.PortfolioResult;

/**
 * Default implementation of {@link MetricsService}.
 * Orchestrates all calculators and builds the final {@link MetricsResult}.
 */
@Service
public class DefaultMetricsService implements MetricsService {

    private final MetricsValidator validator;
    private final TotalReturnCalculator totalReturnCalculator;
    private final TotalTradesCalculator totalTradesCalculator;
    private final WinningTradesCalculator winningTradesCalculator;
    private final LosingTradesCalculator losingTradesCalculator;
    private final WinRateCalculator winRateCalculator;
    private final ProfitFactorCalculator profitFactorCalculator;
    private final AverageWinCalculator averageWinCalculator;
    private final AverageLossCalculator averageLossCalculator;
    private final BestTradeCalculator bestTradeCalculator;
    private final WorstTradeCalculator worstTradeCalculator;
    private final ConsecutiveWinsCalculator consecutiveWinsCalculator;
    private final ConsecutiveLossesCalculator consecutiveLossesCalculator;
    private final ExpectancyCalculator expectancyCalculator;
    private final RewardRiskRatioCalculator rewardRiskRatioCalculator;
    private final MaxDrawdownCalculator maxDrawdownCalculator;
    private final RecoveryFactorCalculator recoveryFactorCalculator;
    private final SharpeRatioCalculator sharpeRatioCalculator;
    private final SortinoRatioCalculator sortinoRatioCalculator;
    final CalmarRatioCalculator calmarRatioCalculator;
    final CAGRCalculator cagrCalculator;

    public DefaultMetricsService(
            MetricsValidator validator,
            TotalReturnCalculator totalReturnCalculator,
            TotalTradesCalculator totalTradesCalculator,
            WinningTradesCalculator winningTradesCalculator,
            LosingTradesCalculator losingTradesCalculator,
            WinRateCalculator winRateCalculator,
            ProfitFactorCalculator profitFactorCalculator,
            AverageWinCalculator averageWinCalculator,
            AverageLossCalculator averageLossCalculator,
            BestTradeCalculator bestTradeCalculator,
            WorstTradeCalculator worstTradeCalculator,
            ConsecutiveWinsCalculator consecutiveWinsCalculator,
            ConsecutiveLossesCalculator consecutiveLossesCalculator,
            ExpectancyCalculator expectancyCalculator,
            RewardRiskRatioCalculator rewardRiskRatioCalculator,
            MaxDrawdownCalculator maxDrawdownCalculator,
            RecoveryFactorCalculator recoveryFactorCalculator,
            SharpeRatioCalculator sharpeRatioCalculator,
            SortinoRatioCalculator sortinoRatioCalculator,
            CalmarRatioCalculator calmarRatioCalculator,
            CAGRCalculator cagrCalculator) {
        this.validator = Objects.requireNonNull(validator, "validator cannot be null");
        this.totalReturnCalculator = Objects.requireNonNull(totalReturnCalculator, "totalReturnCalculator cannot be null");
        this.totalTradesCalculator = Objects.requireNonNull(totalTradesCalculator, "totalTradesCalculator cannot be null");
        this.winningTradesCalculator = Objects.requireNonNull(winningTradesCalculator, "winningTradesCalculator cannot be null");
        this.losingTradesCalculator = Objects.requireNonNull(losingTradesCalculator, "losingTradesCalculator cannot be null");
        this.winRateCalculator = Objects.requireNonNull(winRateCalculator, "winRateCalculator cannot be null");
        this.profitFactorCalculator = Objects.requireNonNull(profitFactorCalculator, "profitFactorCalculator cannot be null");
        this.averageWinCalculator = Objects.requireNonNull(averageWinCalculator, "averageWinCalculator cannot be null");
        this.averageLossCalculator = Objects.requireNonNull(averageLossCalculator, "averageLossCalculator cannot be null");
        this.bestTradeCalculator = Objects.requireNonNull(bestTradeCalculator, "bestTradeCalculator cannot be null");
        this.worstTradeCalculator = Objects.requireNonNull(worstTradeCalculator, "worstTradeCalculator cannot be null");
        this.consecutiveWinsCalculator = Objects.requireNonNull(consecutiveWinsCalculator, "consecutiveWinsCalculator cannot be null");
        this.consecutiveLossesCalculator = Objects.requireNonNull(consecutiveLossesCalculator, "consecutiveLossesCalculator cannot be null");
        this.expectancyCalculator = Objects.requireNonNull(expectancyCalculator, "expectancyCalculator cannot be null");
        this.rewardRiskRatioCalculator = Objects.requireNonNull(rewardRiskRatioCalculator, "rewardRiskRatioCalculator cannot be null");
        this.maxDrawdownCalculator = Objects.requireNonNull(maxDrawdownCalculator, "maxDrawdownCalculator cannot be null");
        this.recoveryFactorCalculator = Objects.requireNonNull(recoveryFactorCalculator, "recoveryFactorCalculator cannot be null");
        this.sharpeRatioCalculator = Objects.requireNonNull(sharpeRatioCalculator, "sharpeRatioCalculator cannot be null");
        this.sortinoRatioCalculator = Objects.requireNonNull(sortinoRatioCalculator, "sortinoRatioCalculator cannot be null");
        this.calmarRatioCalculator = Objects.requireNonNull(calmarRatioCalculator, "calmarRatioCalculator cannot be null");
        this.cagrCalculator = Objects.requireNonNull(cagrCalculator, "cagrCalculator cannot be null");
    }

    @Override
    public MetricsResult calculate(List<ExecutedTrade> trades, PortfolioResult portfolioResult) {
        validator.validate(trades, portfolioResult);

        List<ExecutedTrade> safeTrades = (trades != null) ? trades : List.of();
        List<EquityPoint> equityCurve = (portfolioResult != null && portfolioResult.getEquityCurve() != null)
                ? portfolioResult.getEquityCurve()
                : List.of();

        double initialCapital = portfolioResult.getPortfolio() != null
                ? portfolioResult.getPortfolio().getInitialCapital()
                : 0.0;
        double finalBalance = portfolioResult.getPortfolio() != null
                ? portfolioResult.getPortfolio().getCurrentBalance()
                : initialCapital;

        int totalTrades = totalTradesCalculator.calculate(safeTrades);
        int winningTrades = winningTradesCalculator.calculate(safeTrades);
        int losingTrades = losingTradesCalculator.calculate(safeTrades);
        double profitFactor = profitFactorCalculator.calculate(safeTrades);
        double averageWin = averageWinCalculator.calculate(safeTrades);
        double averageLoss = averageLossCalculator.calculate(safeTrades);
        double bestTrade = bestTradeCalculator.calculate(safeTrades);
        double worstTrade = worstTradeCalculator.calculate(safeTrades);
        int maxConsecutiveWins = consecutiveWinsCalculator.calculate(safeTrades);
        int maxConsecutiveLosses = consecutiveLossesCalculator.calculate(safeTrades);
        double expectancy = expectancyCalculator.calculate(safeTrades, totalTrades);
        double rewardRiskRatio = rewardRiskRatioCalculator.calculate(safeTrades);
        double maxDrawdown = maxDrawdownCalculator.calculate(equityCurve);
        double recoveryFactor = recoveryFactorCalculator.calculate(safeTrades, equityCurve);
        double sharpeRatio = sharpeRatioCalculator.calculate(equityCurve);
        double sortinoRatio = sortinoRatioCalculator.calculate(equityCurve);
        double cagr = cagrCalculator.calculate(initialCapital, finalBalance, equityCurve, safeTrades);
        double calmarRatio = calmarRatioCalculator.calculate(initialCapital, finalBalance, equityCurve, safeTrades);
        double totalReturnPercent = totalReturnCalculator.calculate(initialCapital, finalBalance);
        double winRate = winRateCalculator.calculate(safeTrades, totalTrades);

        return MetricsResult.builder()
                .initialCapital(initialCapital)
                .finalBalance(finalBalance)
                .totalReturnPercent(totalReturnPercent)
                .totalTrades(totalTrades)
                .winningTrades(winningTrades)
                .losingTrades(losingTrades)
                .winRate(winRate)
                .profitFactor(profitFactor)
                .averageWin(averageWin)
                .averageLoss(averageLoss)
                .bestTrade(bestTrade)
                .worstTrade(worstTrade)
                .maxConsecutiveWins(maxConsecutiveWins)
                .maxConsecutiveLosses(maxConsecutiveLosses)
                .expectancy(expectancy)
                .rewardRiskRatio(rewardRiskRatio)
                .maxDrawdown(maxDrawdown)
                .recoveryFactor(recoveryFactor)
                .sharpeRatio(sharpeRatio)
                .sortinoRatio(sortinoRatio)
                .calmarRatio(calmarRatio)
                .cagr(cagr)
                .build();
    }
}
