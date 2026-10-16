package com.trading.strategy.factory;

import com.trading.strategy.enums.StrategyType;
import com.trading.strategy.model.DynamicStrategyParameters;
import com.trading.strategy.model.StrategyParameters;
import org.springframework.stereotype.Component;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseStrategy;
import org.ta4j.core.Indicator;
import org.ta4j.core.Rule;
import org.ta4j.core.Strategy;
import org.ta4j.core.indicators.ATRIndicator;
import org.ta4j.core.indicators.MACDIndicator;
import org.ta4j.core.indicators.RSIIndicator;
import org.ta4j.core.indicators.averages.EMAIndicator;
import org.ta4j.core.indicators.averages.SMAIndicator;
import org.ta4j.core.indicators.bollinger.BollingerBandsLowerIndicator;
import org.ta4j.core.indicators.bollinger.BollingerBandsMiddleIndicator;
import org.ta4j.core.indicators.bollinger.BollingerBandsUpperIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.indicators.helpers.HighPriceIndicator;
import org.ta4j.core.indicators.helpers.LowPriceIndicator;
import org.ta4j.core.indicators.helpers.MedianPriceIndicator;
import org.ta4j.core.indicators.helpers.OpenPriceIndicator;
import org.ta4j.core.indicators.helpers.TypicalPriceIndicator;
import org.ta4j.core.indicators.helpers.VolumeIndicator;
import org.ta4j.core.indicators.statistics.StandardDeviationIndicator;
import org.ta4j.core.num.Num;
import org.ta4j.core.rules.BooleanRule;
import org.ta4j.core.rules.CrossedDownIndicatorRule;
import org.ta4j.core.rules.CrossedUpIndicatorRule;
import org.ta4j.core.rules.IsEqualRule;
import org.ta4j.core.rules.NotRule;
import org.ta4j.core.rules.OverIndicatorRule;
import org.ta4j.core.rules.UnderIndicatorRule;

import java.util.List;
import java.util.Map;

@Component
public class DynamicRuleStrategyFactory implements TradingStrategyFactory {

    @Override
    public StrategyType getType() {
        return StrategyType.DYNAMIC_DSL;
    }

    @Override
    public int getRequiredWarmupBars(StrategyParameters parameters) {
        if (parameters instanceof DynamicStrategyParameters dynamicParams) {
            return dynamicParams.getWarmupBarsOrDefault();
        }
        return 50;
    }

    @Override
    public Strategy build(BarSeries series, StrategyParameters parameters) {
        if (!(parameters instanceof DynamicStrategyParameters dynamicParams)) {
            throw new IllegalArgumentException("Parameters must be of type DynamicStrategyParameters");
        }

        Rule entryRule = buildRule(series, dynamicParams.getEntryRule());
        Rule exitRule = buildRule(series, dynamicParams.getExitRule());

        if (entryRule == null) {
            entryRule = new BooleanRule(false);
        }
        if (exitRule == null) {
            exitRule = new BooleanRule(false);
        }

        return new BaseStrategy(entryRule, exitRule);
    }

    @Override
    public String getEntrySignalName() {
        return "Dynamic Entry";
    }

    @Override
    public String getExitSignalName() {
        return "Dynamic Exit";
    }

    @SuppressWarnings("unchecked")
    public Rule buildRule(BarSeries series, Map<String, Object> ruleMap) {
        if (ruleMap == null || ruleMap.isEmpty()) {
            return new BooleanRule(false);
        }

        String type = (String) ruleMap.getOrDefault("type", "");
        type = type.toUpperCase();

        switch (type) {
            case "CROSSED_UP":
            case "CROSSOVER": {
                Indicator<Num> left = parseIndicator(series, ruleMap.get("left"));
                Object rightObj = ruleMap.get("right");
                if (rightObj instanceof Number num) {
                    return new CrossedUpIndicatorRule(left, num.doubleValue());
                }
                Indicator<Num> right = parseIndicator(series, rightObj);
                return new CrossedUpIndicatorRule(left, right);
            }
            case "CROSSED_DOWN":
            case "CROSSUNDER": {
                Indicator<Num> left = parseIndicator(series, ruleMap.get("left"));
                Object rightObj = ruleMap.get("right");
                if (rightObj instanceof Number num) {
                    return new CrossedDownIndicatorRule(left, num.doubleValue());
                }
                Indicator<Num> right = parseIndicator(series, rightObj);
                return new CrossedDownIndicatorRule(left, right);
            }
            case "OVER":
            case "GREATER_THAN": {
                Indicator<Num> left = parseIndicator(series, ruleMap.get("left"));
                Object rightObj = ruleMap.get("right");
                if (rightObj instanceof Number num) {
                    return new OverIndicatorRule(left, num.doubleValue());
                }
                Indicator<Num> right = parseIndicator(series, rightObj);
                return new OverIndicatorRule(left, right);
            }
            case "UNDER":
            case "LESS_THAN": {
                Indicator<Num> left = parseIndicator(series, ruleMap.get("left"));
                Object rightObj = ruleMap.get("right");
                if (rightObj instanceof Number num) {
                    return new UnderIndicatorRule(left, num.doubleValue());
                }
                Indicator<Num> right = parseIndicator(series, rightObj);
                return new UnderIndicatorRule(left, right);
            }
            case "GREATER_EQUAL":
            case "GTE": {
                Indicator<Num> left = parseIndicator(series, ruleMap.get("left"));
                Object rightObj = ruleMap.get("right");
                if (rightObj instanceof Number num) {
                    return new OverIndicatorRule(left, num.doubleValue()).or(new IsEqualRule(left, num.doubleValue()));
                }
                Indicator<Num> right = parseIndicator(series, rightObj);
                return new OverIndicatorRule(left, right).or(new IsEqualRule(left, right));
            }
            case "LESS_EQUAL":
            case "LTE": {
                Indicator<Num> left = parseIndicator(series, ruleMap.get("left"));
                Object rightObj = ruleMap.get("right");
                if (rightObj instanceof Number num) {
                    return new UnderIndicatorRule(left, num.doubleValue()).or(new IsEqualRule(left, num.doubleValue()));
                }
                Indicator<Num> right = parseIndicator(series, rightObj);
                return new UnderIndicatorRule(left, right).or(new IsEqualRule(left, right));
            }
            case "EQ":
            case "EQUAL":
            case "IS_EQUAL": {
                Indicator<Num> left = parseIndicator(series, ruleMap.get("left"));
                Object rightObj = ruleMap.get("right");
                if (rightObj instanceof Number num) {
                    return new IsEqualRule(left, num.doubleValue());
                }
                Indicator<Num> right = parseIndicator(series, rightObj);
                return new IsEqualRule(left, right);
            }
            case "NOT": {
                Rule inner = buildRule(series, (Map<String, Object>) ruleMap.get("rule"));
                return new NotRule(inner);
            }
            case "AND": {
                if (ruleMap.containsKey("rules") && ruleMap.get("rules") instanceof List<?> list) {
                    Rule combined = null;
                    for (Object item : list) {
                        if (item instanceof Map<?, ?> itemMap) {
                            Rule r = buildRule(series, (Map<String, Object>) itemMap);
                            combined = (combined == null) ? r : combined.and(r);
                        }
                    }
                    return combined != null ? combined : new BooleanRule(false);
                } else {
                    Rule left = buildRule(series, (Map<String, Object>) ruleMap.get("left"));
                    Rule right = buildRule(series, (Map<String, Object>) ruleMap.get("right"));
                    return left.and(right);
                }
            }
            case "OR": {
                if (ruleMap.containsKey("rules") && ruleMap.get("rules") instanceof List<?> list) {
                    Rule combined = null;
                    for (Object item : list) {
                        if (item instanceof Map<?, ?> itemMap) {
                            Rule r = buildRule(series, (Map<String, Object>) itemMap);
                            combined = (combined == null) ? r : combined.or(r);
                        }
                    }
                    return combined != null ? combined : new BooleanRule(false);
                } else {
                    Rule left = buildRule(series, (Map<String, Object>) ruleMap.get("left"));
                    Rule right = buildRule(series, (Map<String, Object>) ruleMap.get("right"));
                    return left.or(right);
                }
            }
            case "BOOLEAN": {
                boolean val = Boolean.TRUE.equals(ruleMap.get("value"));
                return new BooleanRule(val);
            }
            default:
                return new BooleanRule(false);
        }
    }

    @SuppressWarnings("unchecked")
    private Indicator<Num> parseIndicator(BarSeries series, Object indicatorObj) {
        if (indicatorObj == null) {
            return new ClosePriceIndicator(series);
        }

        if (indicatorObj instanceof Map<?, ?> map) {
            Map<String, Object> indMap = (Map<String, Object>) map;
            String type = (String) indMap.getOrDefault("indicator", "CLOSE");
            type = type.toUpperCase();

            Indicator<Num> source = indMap.containsKey("source") 
                    ? parseIndicator(series, indMap.get("source"))
                    : new ClosePriceIndicator(series);

            switch (type) {
                case "OPEN":
                    return new OpenPriceIndicator(series);
                case "HIGH":
                    return new HighPriceIndicator(series);
                case "LOW":
                    return new LowPriceIndicator(series);
                case "VOLUME":
                    return new VolumeIndicator(series);
                case "HL2":
                case "MEDIAN":
                    return new MedianPriceIndicator(series);
                case "HLC3":
                case "TYPICAL":
                    return new TypicalPriceIndicator(series);
                case "SMA": {
                    int period = getInt(indMap, "period", 14);
                    return new SMAIndicator(source, period);
                }
                case "EMA": {
                    int period = getInt(indMap, "period", 14);
                    return new EMAIndicator(source, period);
                }
                case "RSI": {
                    int period = getInt(indMap, "period", 14);
                    return new RSIIndicator(source, period);
                }
                case "ATR": {
                    int period = getInt(indMap, "period", 14);
                    return new ATRIndicator(series, period);
                }
                case "BOLLINGER_MIDDLE":
                case "BB_MIDDLE": {
                    int period = getInt(indMap, "period", 20);
                    return new BollingerBandsMiddleIndicator(new SMAIndicator(source, period));
                }
                case "BOLLINGER_UPPER":
                case "BB_UPPER": {
                    int period = getInt(indMap, "period", 20);
                    double mult = getDouble(indMap, "multiplier", 2.0);
                    BollingerBandsMiddleIndicator bbm = new BollingerBandsMiddleIndicator(new SMAIndicator(source, period));
                    StandardDeviationIndicator sd = new StandardDeviationIndicator(source, period);
                    return new BollingerBandsUpperIndicator(bbm, sd, org.ta4j.core.num.DecimalNum.valueOf(mult));
                }
                case "BOLLINGER_LOWER":
                case "BB_LOWER": {
                    int period = getInt(indMap, "period", 20);
                    double mult = getDouble(indMap, "multiplier", 2.0);
                    BollingerBandsMiddleIndicator bbm = new BollingerBandsMiddleIndicator(new SMAIndicator(source, period));
                    StandardDeviationIndicator sd = new StandardDeviationIndicator(source, period);
                    return new BollingerBandsLowerIndicator(bbm, sd, org.ta4j.core.num.DecimalNum.valueOf(mult));
                }
                case "MACD": {
                    int shortP = getInt(indMap, "shortPeriod", 12);
                    int longP = getInt(indMap, "longPeriod", 26);
                    return new MACDIndicator(source, shortP, longP);
                }
                case "MACD_SIGNAL": {
                    int shortP = getInt(indMap, "shortPeriod", 12);
                    int longP = getInt(indMap, "longPeriod", 26);
                    int signalP = getInt(indMap, "signalPeriod", 9);
                    MACDIndicator macd = new MACDIndicator(source, shortP, longP);
                    return new EMAIndicator(macd, signalP);
                }
                case "CLOSE":
                default:
                    return new ClosePriceIndicator(series);
            }
        }

        return new ClosePriceIndicator(series);
    }

    private int getInt(Map<String, Object> map, String key, int defaultValue) {
        Object val = map.get(key);
        if (val instanceof Number num) {
            return num.intValue();
        }
        return defaultValue;
    }

    private double getDouble(Map<String, Object> map, String key, double defaultValue) {
        Object val = map.get(key);
        if (val instanceof Number num) {
            return num.doubleValue();
        }
        return defaultValue;
    }
}
