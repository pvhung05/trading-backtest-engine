package com.trading.ta4j;

import java.time.Duration;
import java.time.Instant;

import org.ta4j.core.BarBuilder;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseBarSeriesBuilder;
import org.ta4j.core.BaseStrategy;
import org.ta4j.core.indicators.averages.SMAIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.num.DecimalNum;
import org.ta4j.core.rules.CrossedDownIndicatorRule;
import org.ta4j.core.rules.CrossedUpIndicatorRule;
import org.ta4j.core.rules.StopGainRule;
import org.ta4j.core.rules.StopLossRule;
import org.ta4j.core.Rule;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;
import org.ta4j.core.backtest.BarSeriesManager;

public final class Ta4jManualDemo {

	private Ta4jManualDemo() {
	}

	public static void main(String[] args) {
		BarSeries series = new BaseBarSeriesBuilder()
        .withName("btc-usd-demo")
        .build();

		series.barBuilder()
				.timePeriod(Duration.ofMinutes(5))
				.endTime(Instant.parse("2025-01-01T00:05:00Z"))
				.openPrice(42000)
				.highPrice(42150)
				.lowPrice(41980)
				.closePrice(42100)
				.volume(12.4)
				.add();
		series.barBuilder()
				.timePeriod(Duration.ofMinutes(5))
				.endTime(Instant.parse("2025-01-01T00:10:00Z"))
				.openPrice(43000)
				.highPrice(43150)
				.lowPrice(42980)
				.closePrice(43100)
				.volume(12.4)
				.add();
		
		ClosePriceIndicator closePrice = new ClosePriceIndicator(series);
		SMAIndicator fastSma = new SMAIndicator(closePrice, 5);
		SMAIndicator slowSma = new SMAIndicator(closePrice, 30);

		Rule entryRule = new CrossedUpIndicatorRule(fastSma, slowSma);
		Rule exitRule = new CrossedDownIndicatorRule(fastSma, slowSma)
				.or(new StopLossRule(closePrice, series.numFactory().numOf(3)))
				.or(new StopGainRule(closePrice, series.numFactory().numOf(5)));

		Strategy strategy = new BaseStrategy("SMA crossover", entryRule, exitRule);
		strategy.setUnstableBars(30);

		BarSeriesManager manager = new BarSeriesManager(series);
		TradingRecord record = manager.run(strategy);
		
		System.out.println(series.getBar(0).getClosePrice());
		System.out.println(series.getBar(1).getClosePrice());
		System.out.printf("Closed positions: %d%n", record.getPositionCount());
		System.out.printf("Current position open? %s%n", record.getCurrentPosition().isOpened());
	}
}
