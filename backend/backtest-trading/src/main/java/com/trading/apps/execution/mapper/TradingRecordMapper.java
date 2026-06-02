package com.trading.apps.execution.mapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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
		Objects.requireNonNull(tradingRecord, "tradingRecord cannot be null");
		Objects.requireNonNull(series, "series cannot be null");

		List<TradeExecution> executions = new ArrayList<>();

		for (Position position : tradingRecord.getPositions()) {
			TradeExecution execution = toTradeExecution(position, series);
			if (execution != null) {
				executions.add(execution);
			}
		}

		return executions;
	}

	private TradeExecution toTradeExecution(Position position, BarSeries series) {
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

		return TradeExecution.builder()
				.entryTime(entryBar.getEndTime())
				.exitTime(exitBar.getEndTime())
				.entryPrice(entryBar.getClosePrice().doubleValue())
				.exitPrice(exitBar.getClosePrice().doubleValue())
				.build();
	}
}
