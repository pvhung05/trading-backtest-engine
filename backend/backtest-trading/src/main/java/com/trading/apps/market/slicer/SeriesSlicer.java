package com.trading.apps.market.slicer;

import java.time.Instant;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseBarSeriesBuilder;

import com.trading.apps.market.exception.MarketDataException;

/**
 * Slices a BarSeries into a subset based on start and end times.
 * Extracts relevant bars from a full cached series for specific time ranges.
 *
 * @author Trading System
 */
public class SeriesSlicer {

    private static final Logger logger = LoggerFactory.getLogger(SeriesSlicer.class);

    private SeriesSlicer() {
        // Utility class - no instantiation
    }

    /**
     * Slices a BarSeries to include only bars within the specified time range.
     *
     * @param fullSeries the complete bar series
     * @param startTime  the inclusive start time
     * @param endTime    the inclusive end time
     * @return a new BarSeries containing only bars within the time range
     * @throws MarketDataException if no bars are found in the range
     */
    public static BarSeries slice(BarSeries fullSeries, Instant startTime, Instant endTime) {
        Objects.requireNonNull(fullSeries, "fullSeries cannot be null");
        Objects.requireNonNull(startTime, "startTime cannot be null");
        Objects.requireNonNull(endTime, "endTime cannot be null");

        if (endTime.isBefore(startTime)) {
            throw new IllegalArgumentException("endTime must be after or equal to startTime");
        }

        int startIndex = findStartIndex(fullSeries, startTime);
        int endIndex = findEndIndex(fullSeries, endTime);

        if (startIndex > endIndex) {
            throw new MarketDataException(
                    String.format("No bars found in range [%s, %s] for series %s",
                            startTime, endTime, fullSeries.getName())
            );
        }

        logger.debug("Slicing series {} from index {} to {}", fullSeries.getName(), startIndex, endIndex);

        return buildSlicedSeries(fullSeries, startIndex, endIndex);
    }

    /**
     * Finds the index of the first bar at or after the start time.
     *
     * @param series    the bar series
     * @param startTime the start time
     * @return the index of the first bar at or after startTime
     */
    private static int findStartIndex(BarSeries series, Instant startTime) {
        for (int i = 0; i < series.getBarCount(); i++) {
            Bar bar = series.getBar(i);
            if (!bar.getEndTime().isBefore(startTime)) {
                return i;
            }
        }
        return series.getBarCount();
    }

    /**
     * Finds the index of the last bar at or before the end time.
     *
     * @param series  the bar series
     * @param endTime the end time
     * @return the index of the last bar at or before endTime
     */
    private static int findEndIndex(BarSeries series, Instant endTime) {
        for (int i = series.getBarCount() - 1; i >= 0; i--) {
            Bar bar = series.getBar(i);
            if (!bar.getEndTime().isAfter(endTime)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Builds a new BarSeries from a slice of bars.
     *
     * @param fullSeries the original series
     * @param startIndex the inclusive start index
     * @param endIndex   the inclusive end index
     * @return a new BarSeries with sliced bars
     */
    private static BarSeries buildSlicedSeries(BarSeries fullSeries, int startIndex, int endIndex) {
        BarSeries slicedSeries = new BaseBarSeriesBuilder()
                .withName(fullSeries.getName())
                .build();

        for (int i = startIndex; i <= endIndex; i++) {
            Bar bar = fullSeries.getBar(i);
            slicedSeries.addBar(bar);
        }

        logger.info("Created sliced series {} with {} bars from {} total bars",
                fullSeries.getName(), slicedSeries.getBarCount(), fullSeries.getBarCount());

        return slicedSeries;
    }
}
