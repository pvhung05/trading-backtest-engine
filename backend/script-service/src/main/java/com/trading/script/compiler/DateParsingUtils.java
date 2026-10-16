package com.trading.script.compiler;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility for parsing and normalizing date/time specifications from
 * user script codes, directives, or shorthand notations into ISO-8601 UTC Instants.
 */
public final class DateParsingUtils {

    private static final Pattern YMD_PATTERN = Pattern.compile(
            "^(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})(?:[T ](\\d{1,2}):(\\d{1,2})(?::(\\d{1,2}))?)?(?:Z)?$");
    private static final Pattern DMY_PATTERN = Pattern.compile(
            "^(\\d{1,2})[-/](\\d{1,2})[-/](\\d{4})(?:[T ](\\d{1,2}):(\\d{1,2})(?::(\\d{1,2}))?)?(?:Z)?$");

    private DateParsingUtils() {}

    /**
     * Parses an object (String, Number, Instant) into an Instant.
     * @param val Date/time representation
     * @param isEnd If true and no time is provided, defaults to end of day (23:59:59)
     * @return Instant in UTC, or null if cannot be parsed
     */
    public static Instant parseToInstant(Object val, boolean isEnd) {
        if (val == null) {
            return null;
        }
        if (val instanceof Instant inst) {
            return inst;
        }
        if (val instanceof Number num) {
            long l = num.longValue();
            if (l > 100_000_000_000L) { // Millis
                return Instant.ofEpochMilli(l);
            } else if (l > 1_000_000_000L) { // Seconds
                return Instant.ofEpochSecond(l);
            }
        }

        String s = val.toString().trim();
        // Remove surrounding quotes if any
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.substring(1, s.length() - 1).trim();
        }

        if (s.isEmpty()) {
            return null;
        }

        // Try standard Instant parse (e.g. 2024-01-01T00:00:00Z)
        try {
            return Instant.parse(s);
        } catch (Exception ignored) {
        }

        // Check if numeric string timestamp
        try {
            long l = Long.parseLong(s);
            if (l > 100_000_000_000L) return Instant.ofEpochMilli(l);
            if (l > 1_000_000_000L) return Instant.ofEpochSecond(l);
        } catch (Exception ignored) {
        }

        // Check YYYY-MM-DD or YYYY/MM/DD
        Matcher m = YMD_PATTERN.matcher(s);
        if (m.matches()) {
            int year = Integer.parseInt(m.group(1));
            int month = Integer.parseInt(m.group(2));
            int day = Integer.parseInt(m.group(3));
            int hour = m.group(4) != null ? Integer.parseInt(m.group(4)) : (isEnd ? 23 : 0);
            int min = m.group(5) != null ? Integer.parseInt(m.group(5)) : (isEnd ? 59 : 0);
            int sec = m.group(6) != null ? Integer.parseInt(m.group(6)) : (isEnd ? 59 : 0);
            return LocalDateTime.of(year, month, day, hour, min, sec).toInstant(ZoneOffset.UTC);
        }

        // Check DD-MM-YYYY or DD/MM/YYYY
        Matcher dmy = DMY_PATTERN.matcher(s);
        if (dmy.matches()) {
            int day = Integer.parseInt(dmy.group(1));
            int month = Integer.parseInt(dmy.group(2));
            int year = Integer.parseInt(dmy.group(3));
            int hour = dmy.group(4) != null ? Integer.parseInt(dmy.group(4)) : (isEnd ? 23 : 0);
            int min = dmy.group(5) != null ? Integer.parseInt(dmy.group(5)) : (isEnd ? 59 : 0);
            int sec = dmy.group(6) != null ? Integer.parseInt(dmy.group(6)) : (isEnd ? 59 : 0);
            return LocalDateTime.of(year, month, day, hour, min, sec).toInstant(ZoneOffset.UTC);
        }

        return null;
    }

    /**
     * Converts a year, month, day tuple into an ISO string.
     */
    public static String createTimestamp(int year, int month, int day, int hour, int min, int sec) {
        try {
            Instant inst = LocalDateTime.of(year, month, day, hour, min, sec).toInstant(ZoneOffset.UTC);
            return inst.toString();
        } catch (Exception e) {
            return null;
        }
    }

    public static String formatIso(Instant instant) {
        return instant != null ? instant.toString() : null;
    }

    public static String normalizeToString(Object val, boolean isEnd) {
        Instant inst = parseToInstant(val, isEnd);
        return formatIso(inst);
    }

    /**
     * Normalizes a timeframe representation (e.g. "1h", "15m", "60", "D", "1d", "4h")
     * into a standard trading engine timeframe.
     */
    public static String normalizeTimeframe(Object val) {
        if (val == null) {
            return null;
        }
        String s = val.toString().trim();
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.substring(1, s.length() - 1).trim();
        }
        if (s.isEmpty()) {
            return null;
        }

        String lower = s.toLowerCase();
        return switch (lower) {
            case "1", "1m", "1 min", "1 phút", "1 phut" -> "1m";
            case "3", "3m", "3 min", "3 phút", "3 phut" -> "3m";
            case "5", "5m", "5 min", "5 phút", "5 phut" -> "5m";
            case "15", "15m", "15 min", "15 phút", "15 phut" -> "15m";
            case "30", "30m", "30 min", "30 phút", "30 phut" -> "30m";
            case "60", "1h", "1 h", "1 giờ", "1 gio", "60m" -> "1h";
            case "120", "2h", "2 h", "2 giờ", "2 gio", "120m" -> "2h";
            case "240", "4h", "4 h", "4 giờ", "4 gio", "240m" -> "4h";
            case "360", "6h", "6 h", "6 giờ", "6 gio" -> "6h";
            case "480", "8h", "8 h", "8 giờ", "8 gio" -> "8h";
            case "720", "12h", "12 h", "12 giờ", "12 gio" -> "12h";
            case "d", "1d", "1 d", "day", "daily", "1 ngày", "1 ngay", "1440" -> "1d";
            case "3d", "3 d" -> "3d";
            case "w", "1w", "1 w", "week", "weekly", "1 tuần", "1 tuan" -> "1w";
            case "m", "month", "monthly", "1 tháng", "1 thang" -> "1M";
            default -> lower;
        };
    }
}
