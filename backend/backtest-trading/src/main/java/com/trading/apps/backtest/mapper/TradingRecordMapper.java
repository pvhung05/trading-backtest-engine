package com.trading.apps.backtest.mapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Component;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;
import org.ta4j.core.Position;
import org.ta4j.core.TradingRecord;

import com.trading.apps.backtest.model.BacktestResult;
import com.trading.apps.backtest.model.Trade;

/**
 * Maps TA4J trading records to domain backtest results.
 */
@Component
public class TradingRecordMapper {

    /**
     * Maps a trading record and its originating series to a backtest result.
     *
     * @param record the TA4J trading record
     * @param series the bar series used for the backtest
     * @return a backtest result with all completed trades
     */
    public BacktestResult toResult(TradingRecord record, BarSeries series) {
        Objects.requireNonNull(record, "record cannot be null");
        Objects.requireNonNull(series, "series cannot be null");

        List<Trade> trades = new ArrayList<>();

        for (Position position : record.getPositions()) {
            Trade trade = toTrade(position, series);
            if (trade != null) {
                trades.add(trade);
            }
        }

        return BacktestResult.builder()
                .trades(trades)
                .build();
    }

    private Trade toTrade(Position position, BarSeries series) {
        if (position == null || !position.isClosed()) {
            return null;
        }

        if (position.getEntry() == null || position.getExit() == null) {
            return null;
        }

        int entryIndex = position.getEntry().getIndex();
        int exitIndex = position.getExit().getIndex();

        if (entryIndex < 0 || exitIndex < 0 || entryIndex >= series.getBarCount() || exitIndex >= series.getBarCount()) {
            return null;
        }

        Bar entryBar = series.getBar(entryIndex);
        Bar exitBar = series.getBar(exitIndex);

        double entryPrice = entryBar.getClosePrice().doubleValue();
        double exitPrice = exitBar.getClosePrice().doubleValue();

        if (entryPrice <= 0.0d) {
            return null;
        }

        double profitPercent = ((exitPrice - entryPrice) / entryPrice) * 100.0d;

        return Trade.builder()
                .entryTime(entryBar.getEndTime())
                .entryPrice(entryPrice)
                .exitTime(exitBar.getEndTime())
                .exitPrice(exitPrice)
                .profitPercent(profitPercent)
                .build();
    }
}