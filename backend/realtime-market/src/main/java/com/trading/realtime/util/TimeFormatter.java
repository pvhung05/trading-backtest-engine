package com.trading.realtime.util;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for formatting timestamps.
 */
public final class TimeFormatter {

	private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter
			.ofPattern("yyyy-MM-dd HH:mm:ss")
			.withZone(ZoneId.systemDefault());

	private TimeFormatter() {
		throw new UnsupportedOperationException("Utility class");
	}

	/**
	 * Formats a timestamp to a readable string.
	 *
	 * @param timestamp the timestamp in milliseconds
	 * @return formatted string
	 */
	public static String format(long timestamp) {
		return TIME_FORMATTER.format(Instant.ofEpochMilli(timestamp));
	}

	/**
	 * Formats a timestamp to date only.
	 *
	 * @param timestamp the timestamp in milliseconds
	 * @return date string
	 */
	public static String formatDate(long timestamp) {
		return DateTimeFormatter.ofPattern("yyyy-MM-dd")
				.withZone(ZoneId.systemDefault())
				.format(Instant.ofEpochMilli(timestamp));
	}
}
