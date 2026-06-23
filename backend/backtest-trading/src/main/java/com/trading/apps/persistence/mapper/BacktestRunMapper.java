package com.trading.apps.persistence.mapper;

import java.time.Instant;

import org.springframework.stereotype.Component;

import com.trading.apps.auth.entity.AppUser;
import com.trading.apps.backtest.model.BacktestResult;
import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.metrics.model.MetricsResult;
import com.trading.apps.persistence.enums.BacktestStatus;
import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.persistence.entity.BacktestRun;
import com.trading.apps.persistence.entity.EquityPointEntity;
import com.trading.apps.persistence.entity.MetricsSnapshot;
import com.trading.apps.persistence.entity.TradeRecord;

import java.util.List;

@Component
public class BacktestRunMapper {

    private final TradeRecordMapper tradeRecordMapper;
    private final MetricsSnapshotMapper metricsSnapshotMapper;
    private final EquityPointMapper equityPointMapper;

    public BacktestRunMapper(TradeRecordMapper tradeRecordMapper,
                             MetricsSnapshotMapper metricsSnapshotMapper,
                             EquityPointMapper equityPointMapper) {
        this.tradeRecordMapper = tradeRecordMapper;
        this.metricsSnapshotMapper = metricsSnapshotMapper;
        this.equityPointMapper = equityPointMapper;
    }

    /**
     * Converts a completed backtest run into a BacktestRun entity hierarchy.
     *
     * @param executedTrades         list of executed trades (size N)
     * @param isLongPerTrade        true=long, false=short per position (size N)
     * @param mfePerTrade           max favorable excursion per trade, in price units (size N, same order)
     * @param maePerTrade           max adverse excursion per trade, in price units (size N, same order)
     * @param cumulativePnlPerTrade cumulative PnL after each trade, in currency units (size N)
     * @param entrySignals          entry signal names (size N)
     * @param exitSignals           exit signal names (size N)
     * @param domainEquityPoints    equity curve points
     * @return a BacktestRun entity populated with trades, metrics, and equity points
     */
    public BacktestRun toEntity(AppUser user,
                                BacktestResult result,
                                MetricsResult metrics,
                                List<ExecutedTrade> executedTrades,
                                boolean[] isLongPerTrade,
                                double[] mfePerTrade,
                                double[] maePerTrade,
                                double[] cumulativePnlPerTrade,
                                String[] entrySignals,
                                String[] exitSignals,
                                StrategyType strategyType,
                                String symbol,
                                String timeframe,
                                Instant startTime,
                                Instant endTime,
                                Long executionDurationMs,
                                String strategyParamsJson,
                                List<com.trading.apps.portfolio.model.EquityPoint> domainEquityPoints) {
        BacktestRun run = BacktestRun.of(user, strategyType, strategyParamsJson,
                symbol, timeframe, startTime, endTime);
        run.setStatus(BacktestStatus.COMPLETED);
        run.setExecutionDurationMs(executionDurationMs);

        if (executedTrades != null) {
            for (int i = 0; i < executedTrades.size(); i++) {
                ExecutedTrade executed = executedTrades.get(i);
                boolean isLong = (isLongPerTrade != null && i < isLongPerTrade.length) ? isLongPerTrade[i] : true;
                double mfe = (mfePerTrade != null && i < mfePerTrade.length) ? mfePerTrade[i] : 0.0;
                double mae = (maePerTrade != null && i < maePerTrade.length) ? maePerTrade[i] : 0.0;
                double cumPnl = (cumulativePnlPerTrade != null && i < cumulativePnlPerTrade.length) ? cumulativePnlPerTrade[i] : 0.0;
                String entrySig = (entrySignals != null && i < entrySignals.length) ? entrySignals[i] : null;
                String exitSig = (exitSignals != null && i < exitSignals.length) ? exitSignals[i] : null;

                TradeRecord record = tradeRecordMapper.toEntity(
                        run, i + 1, executed, isLong, mfe, mae, cumPnl, entrySig, exitSig);
                run.addTrade(record);
            }
        }

        if (metrics != null) {
            MetricsSnapshot snapshot = metricsSnapshotMapper.toEntity(run, metrics);
            run.setMetrics(snapshot);
        }

        if (domainEquityPoints != null) {
            for (com.trading.apps.portfolio.model.EquityPoint point : domainEquityPoints) {
                EquityPointEntity entityPoint = equityPointMapper.toEntity(run, point);
                run.addEquityPoint(entityPoint);
            }
        }

        return run;
    }
}
