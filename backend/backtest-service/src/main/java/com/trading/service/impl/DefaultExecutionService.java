package com.trading.service.impl;

import com.trading.service.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.ta4j.core.BarSeries;
import org.ta4j.core.TradingRecord;

import com.trading.service.calculator.CommissionCalculator;
import com.trading.service.calculator.QuantityCalculator;
import com.trading.service.calculator.SlippageCalculator;
import com.trading.mapper.ExecutionTradingRecordMapper;
import com.trading.model.ExecutionConfig;
import com.trading.model.ExecutedTrade;
import com.trading.model.TradeExecution;

/**
 * Default execution simulator that applies slippage, sizing, and commission rules.
 */
@Service
public class DefaultExecutionService implements ExecutionService {

	private final ExecutionTradingRecordMapper tradingRecordMapper;
	private final CommissionCalculator commissionCalculator;
	private final SlippageCalculator slippageCalculator;
	private final QuantityCalculator quantityCalculator;

	/**
	 * Creates the default execution service.
	 *
	 * @param tradingRecordMapper mapper from ta4j trading records to trade snapshots
	 * @param commissionCalculator commission calculator
	 * @param slippageCalculator slippage calculator
	 * @param quantityCalculator quantity calculator
	 */
	public DefaultExecutionService(
			ExecutionTradingRecordMapper tradingRecordMapper,
			CommissionCalculator commissionCalculator,
			SlippageCalculator slippageCalculator,
			QuantityCalculator quantityCalculator) {
		this.tradingRecordMapper = Objects.requireNonNull(tradingRecordMapper, "tradingRecordMapper cannot be null");
		this.commissionCalculator = Objects.requireNonNull(commissionCalculator, "commissionCalculator cannot be null");
		this.slippageCalculator = Objects.requireNonNull(slippageCalculator, "slippageCalculator cannot be null");
		this.quantityCalculator = Objects.requireNonNull(quantityCalculator, "quantityCalculator cannot be null");
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public List<ExecutedTrade> execute(TradingRecord tradingRecord, BarSeries series, ExecutionConfig config, double capital) {
		return execute(tradingRecord, series, config, capital, null);
	}

	@Override
	public List<ExecutedTrade> execute(TradingRecord tradingRecord, BarSeries series, ExecutionConfig config, double capital, Instant startTime) {
		Objects.requireNonNull(tradingRecord, "tradingRecord cannot be null");
		Objects.requireNonNull(series, "series cannot be null");
		Objects.requireNonNull(config, "config cannot be null");

		List<TradeExecution> tradeExecutions = startTime != null
				? tradingRecordMapper.toTradeExecutions(tradingRecord, series, startTime)
				: tradingRecordMapper.toTradeExecutions(tradingRecord, series);
		List<ExecutedTrade> executedTrades = new ArrayList<>(tradeExecutions.size());

		double runningCapital = capital;

		for (TradeExecution tradeExecution : tradeExecutions) {
			double actualEntryPrice = slippageCalculator.applyBuy(tradeExecution.getEntryPrice(), config.getSlippageRate());
			double actualExitPrice = slippageCalculator.applySell(tradeExecution.getExitPrice(), config.getSlippageRate());
			double quantity = quantityCalculator.calculate(runningCapital, actualEntryPrice, config.getPositionSizePercent());

			double grossProfit = (actualExitPrice - actualEntryPrice) * quantity;
			double entryFee = commissionCalculator.calculate(actualEntryPrice * quantity, config.getCommissionRate());
			double exitFee = commissionCalculator.calculate(actualExitPrice * quantity, config.getCommissionRate());
			double commission = entryFee + exitFee;
			double slippageCost = ((actualEntryPrice - tradeExecution.getEntryPrice()) + (tradeExecution.getExitPrice() - actualExitPrice)) * quantity;
			double netProfit = grossProfit - commission;
			runningCapital += netProfit;

			executedTrades.add(ExecutedTrade.builder()
					.entryTime(tradeExecution.getEntryTime())
					.exitTime(tradeExecution.getExitTime())
					.entryPrice(actualEntryPrice)
					.exitPrice(actualExitPrice)
					.quantity(quantity)
					.grossProfit(grossProfit)
					.commission(commission)
					.slippageCost(slippageCost)
					.netProfit(netProfit)
					.build());
		}

		return executedTrades;
	}
}
