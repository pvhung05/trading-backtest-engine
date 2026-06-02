package com.trading.apps.execution.calculator;

import org.springframework.stereotype.Component;

/**
 * Applies price slippage to simulated buy and sell orders.
 */
@Component
public class SlippageCalculator {

	/**
	 * Applies buy-side slippage to a signal price.
	 *
	 * @param signalPrice the signal price
	 * @param slippageRate the slippage rate as a decimal fraction
	 * @return the slipped buy price
	 */
	public double applyBuy(double signalPrice, double slippageRate) {
		return signalPrice * (1.0d + slippageRate);
	}

	/**
	 * Applies sell-side slippage to a signal price.
	 *
	 * @param signalPrice the signal price
	 * @param slippageRate the slippage rate as a decimal fraction
	 * @return the slipped sell price
	 */
	public double applySell(double signalPrice, double slippageRate) {
		return signalPrice * (1.0d - slippageRate);
	}
}
