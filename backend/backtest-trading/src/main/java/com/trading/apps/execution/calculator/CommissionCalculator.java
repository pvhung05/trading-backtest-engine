package com.trading.apps.execution.calculator;

import org.springframework.stereotype.Component;

/**
 * Calculates commission fees for executed trades.
 */
@Component
public class CommissionCalculator {

	/**
	 * Calculates the commission for a given trade value.
	 *
	 * @param tradeValue the notional trade value
	 * @param commissionRate the commission rate as a decimal fraction
	 * @return the commission amount
	 */
	public double calculate(double tradeValue, double commissionRate) {
		return tradeValue * commissionRate;
	}
}
