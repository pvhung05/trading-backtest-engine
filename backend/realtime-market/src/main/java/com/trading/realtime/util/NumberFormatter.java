package com.trading.realtime.util;

/**
 * Utility class for formatting numeric values.
 */
public final class NumberFormatter {

	private NumberFormatter() {
		throw new UnsupportedOperationException("Utility class");
	}

	/**
	 * Formats a number string to a specified decimal places.
	 *
	 * @param value  the number string
	 * @param places decimal places
	 * @return formatted string
	 */
	public static String formatDecimal(String value, int places) {
		if (value == null || value.isBlank()) {
			return value;
		}
		try {
			double d = Double.parseDouble(value);
			return String.format("%." + places + "f", d);
		} catch (NumberFormatException e) {
			return value;
		}
	}

	/**
	 * Parses a price string to double, returning 0 on error.
	 *
	 * @param value the price string
	 * @return the parsed double value
	 */
	public static double parseDouble(String value) {
		if (value == null || value.isBlank()) {
			return 0.0;
		}
		try {
			return Double.parseDouble(value);
		} catch (NumberFormatException e) {
			return 0.0;
		}
	}

	/**
	 * Parses a volume string to double.
	 *
	 * @param value the volume string
	 * @return the parsed double value
	 */
	public static double parseVolume(String value) {
		return parseDouble(value);
	}
}
