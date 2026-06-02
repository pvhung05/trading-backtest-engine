package com.trading.apps.execution.service;

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
	 * @return the list of executed trades
	 */
	List<ExecutedTrade> execute(TradingRecord tradingRecord, BarSeries series, ExecutionConfig config, double capital);
}
