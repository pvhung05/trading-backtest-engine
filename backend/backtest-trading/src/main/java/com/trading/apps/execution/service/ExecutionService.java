package com.trading.apps.execution.service;

import java.time.Instant;
import java.util.List;

import org.ta4j.core.BarSeries;
import org.ta4j.core.TradingRecord;

import com.trading.apps.execution.model.ExecutionConfig;
import com.trading.apps.execution.model.ExecutedTrade;

/**
 * Executes a trading record against a bar series using execution assumptions.
 */
public interface ExecutionService {

	/**
	 * Simulates trade execution and returns the executed trades.
	 *
	 * @param tradingRecord the ta4j trading record
	 * @param series the originating bar series
	 * @param config execution configuration
	 * @param capital available capital for sizing
	 * @param startTime the first bar time that should be included in the result, or null to keep all trades
	 * @return the list of executed trades
	 */
	List<ExecutedTrade> execute(TradingRecord tradingRecord, BarSeries series, ExecutionConfig config, double capital);

	/**
	 * Executes a trading record while excluding trades whose entry bar ends before the provided start time.
	 *
	 * @param tradingRecord the ta4j trading record
	 * @param series the originating bar series
	 * @param config execution configuration
	 * @param capital available capital for sizing
	 * @param startTime the first bar time that should be included in the result, or null to keep all trades
	 * @return the list of executed trades
	 */
	default List<ExecutedTrade> execute(TradingRecord tradingRecord, BarSeries series, ExecutionConfig config, double capital, Instant startTime) {
		return execute(tradingRecord, series, config, capital);
	}
}
