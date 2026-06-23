package com.trading.apps.execution.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;
import org.ta4j.core.Position;
import org.ta4j.core.Trade;
import org.ta4j.core.TradingRecord;

/**
 * Analyzes closed positions to compute MFE (Max Favorable Excursion)
 * and MAE (Max Adverse Excursion) during the trade's lifetime.
 */
@Service
public class TradeAnalyzerService {

    /**
     * Analyzes all closed positions in the trading record.
     *
     * @param tradingRecord the trading record from the backtest engine
     * @param series        the bar series
     * @param entrySignal   human-readable name for the entry signal (e.g. "SMA Cross Up")
     * @param exitSignal    human-readable name for the exit signal (e.g. "SMA Cross Down")
     * @return analysis results per position, in the same order as the positions
     */
    public TradeAnalysis[] analyze(TradingRecord tradingRecord, BarSeries series,
                                   String entrySignal, String exitSignal) {
        List<TradeAnalysis> results = new ArrayList<>();
        for (Position position : tradingRecord.getPositions()) {
            if (position == null || !position.isClosed()) {
                continue;
            }
            results.add(analyzePosition(position, series, entrySignal, exitSignal));
        }
        return results.toArray(new TradeAnalysis[0]);
    }

    private TradeAnalysis analyzePosition(Position position, BarSeries series,
                                         String entrySignal, String exitSignal) {
        int entryIndex = position.getEntry().getIndex();
        int exitIndex = position.getExit().getIndex();

        if (entryIndex < 0 || entryIndex >= series.getBarCount()) {
            return new TradeAnalysis(0.0, 0.0, true, entrySignal, exitSignal);
        }

        double entryPrice = series.getBar(entryIndex).getClosePrice().doubleValue();
        boolean isLong = position.getEntry().getType() == Trade.TradeType.BUY;

        double maxFavorable = 0.0;
        double maxAdverse = 0.0;

        // Walk each bar from entry to exit (inclusive)
        int lastIndex = Math.min(exitIndex, series.getBarCount() - 1);
        for (int i = entryIndex; i <= lastIndex; i++) {
            Bar bar = series.getBar(i);
            double high = bar.getHighPrice().doubleValue();
            double low = bar.getLowPrice().doubleValue();

            if (isLong) {
                double favorable = high - entryPrice;
                double adverse = entryPrice - low;
                if (favorable > maxFavorable) maxFavorable = favorable;
                if (adverse > maxAdverse) maxAdverse = adverse;
            } else {
                double favorable = entryPrice - low;
                double adverse = high - entryPrice;
                if (favorable > maxFavorable) maxFavorable = favorable;
                if (adverse > maxAdverse) maxAdverse = adverse;
            }
        }

        String resolvedEntrySignal = isLong ? entrySignal : "Short";
        String resolvedExitSignal = isLong ? exitSignal : "Close Short";

        return new TradeAnalysis(maxFavorable, maxAdverse, isLong, resolvedEntrySignal, resolvedExitSignal);
    }

    /**
     * Result of analyzing a single trade.
     *
     * @param maxFavorableExcursion max favorable price movement during the trade
     * @param maxAdverseExcursion  max adverse price movement during the trade
     * @param isLong              true for long position, false for short
     * @param entrySignal         entry signal name (e.g. "SMA Cross Up")
     * @param exitSignal          exit signal name (e.g. "SMA Cross Down")
     */
    public record TradeAnalysis(
            double maxFavorableExcursion,
            double maxAdverseExcursion,
            boolean isLong,
            String entrySignal,
            String exitSignal
    ) {}
}
