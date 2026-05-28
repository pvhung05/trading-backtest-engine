package com.trading.ta4j;

import java.time.Instant;
import java.time.format.DateTimeParseException;

import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseStrategy;
import org.ta4j.core.indicators.averages.SMAIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.rules.CrossedDownIndicatorRule;
import org.ta4j.core.rules.CrossedUpIndicatorRule;
import org.ta4j.core.rules.StopGainRule;
import org.ta4j.core.rules.StopLossRule;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;

import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.service.MarketDataService;

import org.ta4j.core.Rule;
import org.ta4j.core.Strategy;
import org.ta4j.core.TradingRecord;
import org.ta4j.core.backtest.BarSeriesManager;

public final class Ta4jManualDemo {

	private Ta4jManualDemo() {
	}

	public static void main(String[] args) {
		try (ConfigurableApplicationContext context = SpringApplication.run(com.trading.TradingApplication.class, args)) {
			MarketDataService marketDataService = context.getBean(MarketDataService.class);
			MarketDataRequest request = buildRequest(args);

			BarSeries series = marketDataService.load(request);
			if (series.getBarCount() == 0) {
				System.out.println("No bars returned for request: " + request);
				return;
			}

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

			System.out.printf("Loaded %d bars for %s%n", series.getBarCount(), request);
			System.out.printf("First close price: %s%n", series.getBar(0).getClosePrice());
			System.out.printf("Last close price: %s%n", series.getBar(series.getBarCount() - 1).getClosePrice());
			System.out.printf("Last close price: %s%n", series.getBar(2333-1).getClosePrice());
			System.out.printf("Closed positions: %d%n", record.getPositionCount());
			System.out.printf("Current position open? %s%n", record.getCurrentPosition().isOpened());
		}
	}

	private static MarketDataRequest buildRequest(String[] args) {
		String symbol = args.length > 0 && !args[0].isBlank() ? args[0] : "BTCUSDT";
		String timeframe = args.length > 1 && !args[1].isBlank() ? args[1] : "1d";
		Instant startTime = parseInstantArg(args, 2, Instant.parse("2020-01-01T00:00:00Z"));
		Instant endTime = args.length > 3 && !args[3].isBlank()
				? parseInstantArg(args, 3, Instant.now())
				: Instant.now();

		return new MarketDataRequest(symbol, timeframe, startTime, endTime);
	}

	private static Instant parseInstantArg(String[] args, int index, Instant defaultValue) {
		if (args.length <= index || args[index].isBlank()) {
			return defaultValue;
		}

		try {
			return Instant.parse(args[index].trim());
		} catch (DateTimeParseException ex) {
			throw new IllegalArgumentException("Argument at index " + index + " must be an ISO-8601 instant", ex);
		}
	}
}
