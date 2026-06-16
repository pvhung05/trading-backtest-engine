package com.trading.apps.api.mapper.metrics;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Component;

import com.trading.apps.api.response.execution.ExecutedTradeResponse;
import com.trading.apps.api.response.metrics.MetricsSimulationResponse;
import com.trading.apps.api.response.portfolio.EquityCurvePointResponse;
import com.trading.apps.api.response.portfolio.EquityCurveResponse;
import com.trading.apps.api.response.portfolio.PortfolioStatsResponse;
import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.metrics.model.MetricsResult;
import com.trading.apps.portfolio.model.EquityPoint;
import com.trading.apps.portfolio.model.Portfolio;
import com.trading.apps.portfolio.model.PortfolioResult;

/**
 * Maps between API DTOs and domain models for the Metrics module.
 */
@Component
public class MetricsSimulationResponseMapper {

    /**
     * Converts domain {@link MetricsResult} to API response DTO.
     */
    public MetricsSimulationResponse toResponse(MetricsResult result) {
        return new MetricsSimulationResponse(
                result.getInitialCapital(),
                result.getFinalBalance(),
                result.getTotalReturnPercent(),
                result.getTotalTrades(),
                result.getWinningTrades(),
                result.getLosingTrades(),
                result.getWinRate(),
                result.getProfitFactor(),
                result.getAverageWin(),
                result.getAverageLoss(),
                result.getBestTrade(),
                result.getWorstTrade(),
                result.getMaxConsecutiveWins(),
                result.getMaxConsecutiveLosses(),
                result.getExpectancy(),
                result.getRewardRiskRatio(),
                result.getMaxDrawdown(),
                result.getRecoveryFactor(),
                result.getSharpeRatio(),
                result.getSortinoRatio(),
                result.getCalmarRatio(),
                result.getCagr()
        );
    }

    /**
     * Converts API request trades to domain {@link ExecutedTrade} list.
     */
    public List<ExecutedTrade> toExecutedTrades(List<ExecutedTradeResponse> trades) {
        if (trades == null) {
            return Collections.emptyList();
        }
        List<ExecutedTrade> result = new ArrayList<>();
        for (ExecutedTradeResponse t : trades) {
            result.add(ExecutedTrade.builder()
                    .entryTime(parseInstant(t.entryTime()))
                    .exitTime(parseInstant(t.exitTime()))
                    .entryPrice(t.entryPrice())
                    .exitPrice(t.exitPrice())
                    .quantity(t.quantity())
                    .grossProfit(t.grossProfit())
                    .commission(t.commission())
                    .slippageCost(t.slippageCost())
                    .netProfit(t.netProfit())
                    .build());
        }
        return result;
    }

    /**
     * Converts API request equity curve to domain {@link PortfolioResult}.
     */
    public PortfolioResult toPortfolioResult(
            EquityCurveResponse equityCurve,
            PortfolioStatsResponse stats,
            List<ExecutedTradeResponse> trades) {

        List<EquityPoint> equityPoints = new ArrayList<>();
        if (equityCurve != null && equityCurve.points() != null) {
            for (EquityCurvePointResponse ep : equityCurve.points()) {
                equityPoints.add(EquityPoint.builder()
                        .timestamp(parseInstant(ep.timestamp()))
                        .equity(ep.equity())
                        .openPosition(ep.openPosition())
                        .openPositionPnl(ep.openPositionPnl())
                        .build());
            }
        }

        double initialCapital = stats != null ? stats.initialCapital() : 0.0;
        double finalBalance = stats != null ? stats.finalEquity() : initialCapital;

        Portfolio portfolio = Portfolio.builder()
                .initialCapital(initialCapital)
                .currentBalance(finalBalance)
                .build();

        return PortfolioResult.builder()
                .portfolio(portfolio)
                .equityCurve(equityPoints)
                .snapshots(Collections.emptyList())
                .build();
    }

    private Instant parseInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Instant.parse(value.trim());
    }
}
