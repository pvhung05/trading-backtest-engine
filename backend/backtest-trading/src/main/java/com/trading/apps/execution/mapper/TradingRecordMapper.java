package com.trading.apps.execution.mapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.time.Instant;

import org.springframework.stereotype.Component;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;
import org.ta4j.core.Position;
import org.ta4j.core.TradingRecord;

import com.trading.apps.execution.model.TradeExecution;

/**
 * Maps TA4J trading records to execution-domain trade snapshots.
 */
@Component("executionTradingRecordMapper")
public class TradingRecordMapper {

	/**
	 * Converts a trading record into a list of closed trade executions.
	 *
	 * @param tradingRecord the TA4J trading record
	 * @param series the originating bar series
	 * @return the mapped closed trades
	 */
	public List<TradeExecution> toTradeExecutions(TradingRecord tradingRecord, BarSeries series) {
		return toTradeExecutions(tradingRecord, series, null);
	}

	/**
	 * Converts a trading record into a list of closed trade executions, excluding trades whose
	 * entry bar ends before the provided start time.
	 *
	 * @param tradingRecord the TA4J trading record
	 * @param series the originating bar series
	 * @param startTime the first bar time that should be included in the result, or null to keep all trades
	 * @return the mapped closed trades
	 */
	public List<TradeExecution> toTradeExecutions(TradingRecord tradingRecord, BarSeries series, Instant startTime) {
		Objects.requireNonNull(tradingRecord, "tradingRecord cannot be null");
		Objects.requireNonNull(series, "series cannot be null");

		List<TradeExecution> executions = new ArrayList<>();

		for (Position position : tradingRecord.getPositions()) {
			TradeExecution execution = toTradeExecution(position, series, startTime);
			if (execution != null) {
				executions.add(execution);
			}
		}

		return executions;
	}

	private TradeExecution toTradeExecution(Position position, BarSeries series, Instant startTime) {
		if (position == null || !position.isClosed() || position.getEntry() == null || position.getExit() == null) {
			return null;
		}

		int entryIndex = position.getEntry().getIndex();
		int exitIndex = position.getExit().getIndex();

		if (entryIndex < 0 || exitIndex < 0 || entryIndex >= series.getBarCount() || exitIndex >= series.getBarCount()) {
			return null;
		}

		Bar entryBar = series.getBar(entryIndex);
		Bar exitBar = series.getBar(exitIndex);

		if (startTime != null && entryBar.getEndTime().isBefore(startTime)) {
			return null;
		}

		return TradeExecution.builder()
				.entryTime(entryBar.getEndTime())
				.exitTime(exitBar.getEndTime())
				.entryPrice(entryBar.getClosePrice().doubleValue())
				.exitPrice(exitBar.getClosePrice().doubleValue())
				.build();
	}
}
