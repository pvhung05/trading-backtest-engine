package com.trading.apps.api.mapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.trading.apps.api.response.BacktestRunDetailResponse;
import com.trading.apps.api.response.BacktestRunDetailResponse.EquityPointDetail;
import com.trading.apps.api.response.BacktestRunDetailResponse.MetricsDetail;
import com.trading.apps.api.response.BacktestRunDetailResponse.TradeDetail;
import com.trading.apps.api.response.BacktestRunSummaryResponse;
import com.trading.apps.api.response.BacktestRunSummaryResponse.MetricsSummary;
import com.trading.apps.persistence.entity.BacktestRun;
import com.trading.apps.persistence.entity.EquityPointEntity;
import com.trading.apps.persistence.entity.MetricsSnapshot;
import com.trading.apps.persistence.entity.TradeRecord;

import org.springframework.stereotype.Component;

@Component
public class BacktestRunResponseMapper {

    public BacktestRunSummaryResponse toSummaryResponse(BacktestRun run) {
        MetricsSnapshot m = run.getMetrics();
        MetricsSummary metricsSummary = null;
        if (m != null) {
            metricsSummary = new MetricsSummary(
                    m.getTotalReturnPercent(),
                    m.getTotalTrades(),
                    m.getWinRate(),
                    m.getMaxDrawdown());
        }

        return new BacktestRunSummaryResponse(
                run.getId(),
                run.getStrategyType().name(),
                run.getSymbol(),
                run.getTimeframe(),
                run.getStartTime(),
                run.getEndTime(),
                run.getStatus().name(),
                run.getCreatedAt(),
                run.getExecutionDurationMs(),
                metricsSummary);
    }

    public List<BacktestRunSummaryResponse> toSummaryResponses(List<BacktestRun> runs) {
        List<BacktestRunSummaryResponse> responses = new ArrayList<>();
        for (BacktestRun run : runs) {
            responses.add(toSummaryResponse(run));
        }
        return responses;
    }

    public BacktestRunDetailResponse toDetailResponse(BacktestRun run) {
        MetricsSnapshot m = run.getMetrics();
        MetricsDetail metricsDetail = null;
        if (m != null) {
            metricsDetail = new MetricsDetail(
                    m.getInitialCapital(),
                    m.getFinalBalance(),
                    m.getTotalReturnPercent(),
                    m.getTotalTrades(),
                    m.getWinningTrades(),
                    m.getLosingTrades(),
                    m.getWinRate(),
                    m.getProfitFactor(),
                    m.getAverageWin(),
                    m.getAverageLoss(),
                    m.getBestTrade(),
                    m.getWorstTrade(),
                    m.getMaxConsecutiveWins(),
                    m.getMaxConsecutiveLosses(),
                    m.getExpectancy(),
                    m.getRewardRiskRatio(),
                    m.getMaxDrawdown(),
                    m.getRecoveryFactor(),
                    m.getSharpeRatio(),
                    m.getSortinoRatio(),
                    m.getCalmarRatio(),
                    m.getCagr());
        }

        List<TradeDetail> tradeDetails = toTradeDetails(run);

        List<EquityPointDetail> equityDetails = new ArrayList<>();
        for (EquityPointEntity e : run.getEquityPoints()) {
            equityDetails.add(new EquityPointDetail(
                    e.getTimestamp(),
                    e.getEquity(),
                    e.getCash(),
                    e.getOpenPositionPnl(),
                    e.getTradeNumber()));
        }

        return new BacktestRunDetailResponse(
                run.getId(),
                run.getStrategyType().name(),
                run.getStrategyParams(),
                run.getSymbol(),
                run.getTimeframe(),
                run.getStartTime(),
                run.getEndTime(),
                run.getStatus().name(),
                run.getCreatedAt(),
                run.getExecutionDurationMs(),
                metricsDetail,
                tradeDetails,
                equityDetails);
    }

    public List<TradeDetail> toTradeDetails(BacktestRun run) {
        List<TradeDetail> rows = new ArrayList<>();
        for (TradeRecord t : run.getTrades()) {
            String tradeNumWithSide = t.getTradeNumber() + " " + t.getSide().name();

            // Row 1: Entry
            rows.add(new TradeDetail(
                    tradeNumWithSide,
                    "Entry",
                    t.getEntryTime(),
                    t.getEntrySignal(),
                    t.getEntryPrice(),
                    t.getQuantity(),
                    t.getSizeUsd(),
                    null,    // netPnl only on exit
                    null,    // favorable only on exit
                    null,    // adverse only on exit
                    null     // cumulative only on exit
            ));

            // Row 2: Exit
            rows.add(new TradeDetail(
                    tradeNumWithSide,
                    "Exit",
                    t.getExitTime(),
                    t.getExitSignal(),
                    t.getExitPrice(),
                    t.getQuantity(),
                    t.getSizeUsd(),
                    t.getNetProfit(),
                    t.getMaxFavorableExcursion(),
                    t.getMaxAdverseExcursion(),
                    t.getCumulativePnl()
            ));
        }
        return rows;
    }

    public MetricsDetail toMetricsDetail(BacktestRun run) {
        MetricsSnapshot m = run.getMetrics();
        if (m == null) {
            return null;
        }
        return new MetricsDetail(
                m.getInitialCapital(),
                m.getFinalBalance(),
                m.getTotalReturnPercent(),
                m.getTotalTrades(),
                m.getWinningTrades(),
                m.getLosingTrades(),
                m.getWinRate(),
                m.getProfitFactor(),
                m.getAverageWin(),
                m.getAverageLoss(),
                m.getBestTrade(),
                m.getWorstTrade(),
                m.getMaxConsecutiveWins(),
                m.getMaxConsecutiveLosses(),
                m.getExpectancy(),
                m.getRewardRiskRatio(),
                m.getMaxDrawdown(),
                m.getRecoveryFactor(),
                m.getSharpeRatio(),
                m.getSortinoRatio(),
                m.getCalmarRatio(),
                m.getCagr());
    }

    public List<EquityPointDetail> toEquityPointDetails(BacktestRun run) {
        List<EquityPointDetail> equityDetails = new ArrayList<>();
        for (EquityPointEntity e : run.getEquityPoints()) {
            equityDetails.add(new EquityPointDetail(
                    e.getTimestamp(),
                    e.getEquity(),
                    e.getCash(),
                    e.getOpenPositionPnl(),
                    e.getTradeNumber()));
        }
        return equityDetails;
    }
}
