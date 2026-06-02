package com.trading.apps.execution.calculator;

import org.springframework.stereotype.Component;

/**
 * Calculates trade quantity from available capital and allocation percentage.
 */
@Component
public class QuantityCalculator {

	/**
	 * Calculates the quantity to trade.
	 *
	 * @param capital the available capital
	 * @param entryPrice the entry price used to size the position
	 * @param positionPercent the position size as a percentage of capital
	 * @return the quantity to trade
	 */
	public double calculate(double capital, double entryPrice, double positionPercent) {
		if (entryPrice <= 0.0d) {
			throw new IllegalArgumentException("entryPrice must be greater than zero");
		}

		double positionValue = capital * positionPercent / 100.0d;
		return positionValue / entryPrice;
	}
}
