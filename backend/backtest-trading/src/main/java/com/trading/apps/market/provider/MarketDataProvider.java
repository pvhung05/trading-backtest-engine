package com.trading.apps.market.provider;

import org.ta4j.core.BarSeries;

import com.trading.apps.market.model.MarketDataRequest;

/**
 * Interface for market data providers.
 * Abstracts different data sources (Binance, CSV, Parquet, etc.) behind a common interface.
 *
 * Enables dependency inversion and makes it easy to add new data sources in the future.
 *
 * @author Trading System
 */
public interface MarketDataProvider {

    /**
     * Provides a BarSeries for the given market data request.
     *
     * Implementation should handle:
     * - Data loading from the source
     * - Conversion to domain models
     * - Conversion to TA4J BarSeries format
     *
     * @param request the market data request containing symbol, timeframe, and time range
     * @return a TA4J BarSeries for the specified parameters
     */
    BarSeries provide(MarketDataRequest request);
}
