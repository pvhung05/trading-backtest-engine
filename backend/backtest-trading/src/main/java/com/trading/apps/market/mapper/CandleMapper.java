package com.trading.apps.market.mapper;

import java.time.Duration;
import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseBarSeriesBuilder;
import org.ta4j.core.num.DecimalNum;

import com.trading.apps.market.model.Candle;
import com.trading.apps.market.util.TimeframeUtil;

/**
 * Maps domain Candle objects to TA4J BarSeries.
 * Handles conversion of raw candle data to TA4J format with proper numeric types.
 *
 * @author Trading System
 */
public class CandleMapper {

    private static final Logger logger = LoggerFactory.getLogger(CandleMapper.class);

    private CandleMapper() {
        // Utility class - no instantiation
    }

    /**
     * Converts a list of candles to a TA4J BarSeries.
     *
     * @param candles   the list of candles to convert
     * @param symbol    the trading symbol (used for series name)
     * @param timeframe the timeframe of the candles
     * @return a TA4J BarSeries containing the candles
     */
    public static BarSeries toBarSeries(List<Candle> candles, String symbol, String timeframe) {
        Objects.requireNonNull(candles, "candles cannot be null");
        Objects.requireNonNull(symbol, "symbol cannot be null");
        Objects.requireNonNull(timeframe, "timeframe cannot be null");

        if (candles.isEmpty()) {
            logger.warn("Mapping empty candle list to BarSeries for {}", symbol);
        }

        Duration duration = TimeframeUtil.toDuration(timeframe);
        String seriesName = symbol.toUpperCase();

        BarSeries series = new BaseBarSeriesBuilder()
                .withName(seriesName)
                .build();

        for (Candle candle : candles) {
            Bar bar = createBar(series, candle, duration);
            series.addBar(bar);
        }

        logger.info("Mapped {} candles to BarSeries {} with {} bars",
                candles.size(), seriesName, series.getBarCount());

        return series;
    }

    /**
     * Converts a single Candle to a TA4J Bar.
     *
     * @param series   the bar series for creating the bar
     * @param candle   the candle to convert
     * @param duration the duration of the candle period
     * @return a TA4J Bar
     */
    private static Bar createBar(BarSeries series, Candle candle, Duration duration) {
        return series.barBuilder()
                .timePeriod(duration)
                .endTime(candle.getOpenTime())
                .openPrice(DecimalNum.valueOf(candle.getOpen()))
                .highPrice(DecimalNum.valueOf(candle.getHigh()))
                .lowPrice(DecimalNum.valueOf(candle.getLow()))
                .closePrice(DecimalNum.valueOf(candle.getClose()))
                .volume(DecimalNum.valueOf(candle.getVolume()))
                .build();
    }
}
