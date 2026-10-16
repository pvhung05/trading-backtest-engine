package com.trading.script.compiler;

import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Regex-based transpiler that converts an ultra-simple, human-friendly
 * shorthand trading strategy notation (in English or Vietnamese) into
 * standard Pine Script DSL syntax.
 *
 * Example input:
 *   BUY: ema(9) cross_up ema(21) and rsi(14) < 70
 *   SELL: ema(9) cross_down ema(21) or rsi(14) > 80
 *
 * Or Vietnamese:
 *   MUA KHI: sma(10) cắt lên sma(30) và rsi(14) < 65
 *   BÁN KHI: sma(10) cắt xuống sma(30) hoặc rsi(14) > 75
 */
@Component
public class ShorthandStrategyTranspiler {

    // Regex for detecting if the script is using the shorthand format
    private static final Pattern SHORTHAND_ENTRY_PATTERN = Pattern.compile(
            "(?im)^(?:BUY(?:\\s+WHEN)?|ENTRY|LONG|MUA(?:\\s+KHI)?)\\b\\s*[:=]?\\s*(.+)$");
    private static final Pattern SHORTHAND_EXIT_PATTERN = Pattern.compile(
            "(?im)^(?:SELL(?:\\s+WHEN)?|EXIT|CLOSE|B[AÁ]N(?:\\s+KHI)?)\\b\\s*[:=]?\\s*(.+)$");

    // Infix crossover/crossunder operators
    private static final Pattern INFIX_CROSSOVER = Pattern.compile(
            "([a-zA-Z0-9_.]+(?:\\([^)]*\\))?)\\s+(?:crosses\\s+above|crosses\\s+over|cross_up|c[ắa]t\\s+l[êe]n)\\s+([a-zA-Z0-9_.]+(?:\\([^)]*\\))?)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern INFIX_CROSSUNDER = Pattern.compile(
            "([a-zA-Z0-9_.]+(?:\\([^)]*\\))?)\\s+(?:crosses\\s+below|crosses\\s+under|cross_down|c[ắa]t\\s+xu[ốo]ng)\\s+([a-zA-Z0-9_.]+(?:\\([^)]*\\))?)",
            Pattern.CASE_INSENSITIVE);

    // Indicator shorthands with single number param: sma(14) -> ta.sma(close, 14)
    private static final Pattern SINGLE_PARAM_IND = Pattern.compile(
            "\\b(?<!ta\\.)(sma|ema|rsi)\\s*\\(\\s*(\\d+)\\s*\\)",
            Pattern.CASE_INSENSITIVE);

    // Indicator shorthands with source and period: sma(open, 14) -> ta.sma(open, 14)
    private static final Pattern TWO_PARAM_IND = Pattern.compile(
            "\\b(?<!ta\\.)(sma|ema|rsi)\\s*\\(\\s*([a-zA-Z]+)\\s*,\\s*(\\d+)\\s*\\)",
            Pattern.CASE_INSENSITIVE);

    // MACD shorthand: macd(12, 26, 9) -> ta.macd(close, 12, 26, 9)
    private static final Pattern MACD_IND = Pattern.compile(
            "\\b(?<!ta\\.)macd\\s*\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)",
            Pattern.CASE_INSENSITIVE);

    // Regex for date/time range in shorthand notation
    private static final Pattern SHORTHAND_PERIOD_PATTERN = Pattern.compile(
            "(?im)^(?:THỜI\\s+GIAN|THOI\\s+GIAN|PERIOD|TIME|DATE|TỪ|TU)\\b\\s*[:=]?\\s*(.+)$");
    private static final Pattern DATE_EXTRACTOR = Pattern.compile(
            "\\b(\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}|\\d{1,2}[-/]\\d{1,2}[-/]\\d{4})(?:[T ]\\d{1,2}:\\d{1,2}(?::\\d{1,2})?)?\\b");

    // Regex for timeframe in shorthand notation
    private static final Pattern SHORTHAND_TIMEFRAME_PATTERN = Pattern.compile(
            "(?im)^(?:KHUNG(?:\\s+THỜI\\s+GIAN|\\s+THOI\\s+GIAN)?|TIMEFRAME|TF|INTERVAL|RESOLUTION)\\b\\s*[:=]?\\s*(.+)$");

    /**
     * Checks if the script is in shorthand notation.
     */
    public boolean isShorthand(String source) {
        if (source == null || source.isBlank()) {
            return false;
        }
        String lower = source.toLowerCase();
        if (lower.contains("strategy(") || lower.contains("indicator(") || lower.contains("//@version") 
                || lower.contains("strategy.entry") || lower.contains("strategy.close")) {
            return false;
        }
        return SHORTHAND_ENTRY_PATTERN.matcher(source).find();
    }

    /**
     * Transpiles shorthand script to standard Pine Script syntax.
     */
    public String transpile(String source) {
        if (!isShorthand(source)) {
            return source;
        }

        String entryCondition = null;
        String exitCondition = null;
        String startDateStr = null;
        String endDateStr = null;
        String timeframeStr = null;

        String[] lines = source.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("//")) {
                continue;
            }

            Matcher tfMatcher = SHORTHAND_TIMEFRAME_PATTERN.matcher(trimmed);
            if (tfMatcher.matches()) {
                timeframeStr = DateParsingUtils.normalizeTimeframe(tfMatcher.group(1));
                continue;
            }

            Matcher periodMatcher = SHORTHAND_PERIOD_PATTERN.matcher(trimmed);
            if (periodMatcher.matches()) {
                String periodText = periodMatcher.group(1);
                Matcher dm = DATE_EXTRACTOR.matcher(periodText);
                if (dm.find()) {
                    startDateStr = dm.group(1);
                    if (dm.find()) {
                        endDateStr = dm.group(1);
                    }
                }
                continue;
            }

            Matcher entryMatcher = SHORTHAND_ENTRY_PATTERN.matcher(trimmed);
            if (entryMatcher.matches()) {
                entryCondition = normalizeCondition(entryMatcher.group(1));
                continue;
            }

            Matcher exitMatcher = SHORTHAND_EXIT_PATTERN.matcher(trimmed);
            if (exitMatcher.matches()) {
                exitCondition = normalizeCondition(exitMatcher.group(1));
            }
        }

        if (entryCondition == null && exitCondition == null) {
            return source;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("strategy(\"Shorthand Strategy\", overlay=true");
        if (startDateStr != null) {
            sb.append(", start_time=\"").append(startDateStr).append("\"");
        }
        if (endDateStr != null) {
            sb.append(", end_time=\"").append(endDateStr).append("\"");
        }
        if (timeframeStr != null) {
            sb.append(", timeframe=\"").append(timeframeStr).append("\"");
        }
        sb.append(")\n\n");

        if (startDateStr != null) {
            sb.append("startDate = timestamp(\"").append(startDateStr).append("\")\n");
        }
        if (endDateStr != null) {
            sb.append("endDate = timestamp(\"").append(endDateStr).append("\")\n");
        }
        if (timeframeStr != null) {
            sb.append("timeframe = \"").append(timeframeStr).append("\"\n");
        }
        if (startDateStr != null || endDateStr != null || timeframeStr != null) {
            sb.append("\n");
        }

        if (entryCondition != null) {
            sb.append("if ").append(entryCondition).append("\n");
            sb.append("    strategy.entry(\"Long\", strategy.long)\n\n");
        }

        if (exitCondition != null) {
            sb.append("if ").append(exitCondition).append("\n");
            sb.append("    strategy.close(\"Long\")\n");
        }

        return sb.toString();
    }

    /**
     * Normalizes condition expression by applying regex replacements.
     */
    public String normalizeCondition(String expr) {
        if (expr == null) return "true";

        String res = expr.trim();

        // 1. Normalize infix crossovers FIRST before indicator calls gain commas
        res = INFIX_CROSSOVER.matcher(res).replaceAll("ta.crossover($1, $2)");
        res = INFIX_CROSSUNDER.matcher(res).replaceAll("ta.crossunder($1, $2)");

        // 2. Normalize indicator calls
        res = SINGLE_PARAM_IND.matcher(res).replaceAll("ta.$1(close, $2)");
        res = TWO_PARAM_IND.matcher(res).replaceAll("ta.$1($2, $3)");
        res = MACD_IND.matcher(res).replaceAll("ta.macd(close, $1, $2, $3)");

        // 3. Normalize logical operators (Vietnamese & symbols)
        res = res.replaceAll("(?i)\\s*&&\\s*", " and ");
        res = res.replaceAll("(?i)\\s*\\|\\|\\s*", " or ");
        res = res.replaceAll("(?i)\\s+v[àa]\\s+", " and ");
        res = res.replaceAll("(?i)\\s+ho[ặa]c\\s+", " or ");

        return res;
    }
}
