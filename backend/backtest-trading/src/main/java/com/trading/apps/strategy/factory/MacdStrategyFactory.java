package com.trading.apps.strategy.factory;

import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.strategy.model.StrategyParameters;

import lombok.RequiredArgsConstructor;

import org.ta4j.core.BarSeries;
import com.trading.apps.strategy.model.MacdParameters;
import org.ta4j.core.indicators.MACDIndicator;
import org.ta4j.core.indicators.averages.EMAIndicator;
import org.ta4j.core.rules.CrossedUpIndicatorRule;
import org.ta4j.core.rules.CrossedDownIndicatorRule;
import org.ta4j.core.BaseStrategy;
import org.ta4j.core.Rule;
import com.trading.apps.strategy.indicator.MacdIndicatorProvider;
import com.trading.apps.strategy.rule.MacdRuleProvider;
import org.ta4j.core.Strategy;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MacdStrategyFactory implements TradingStrategyFactory {

    private final MacdIndicatorProvider indicatorProvider;
    private final MacdRuleProvider ruleProvider;

    @Override
    public StrategyType getType() {
        return StrategyType.MACD;
    }

    @Override
    public int getRequiredWarmupBars(StrategyParameters parameters) {
        MacdParameters macdParameters = (MacdParameters) parameters;
        if (macdParameters == null
                || macdParameters.getLongPeriod() == null
                || macdParameters.getSignalPeriod() == null) {
            throw new IllegalArgumentException("MACD parameters must not be null");
        }

        int longP = macdParameters.getLongPeriod();
        int signalP = macdParameters.getSignalPeriod();
        if (longP <= 0 || signalP <= 0) {
            throw new IllegalArgumentException("MACD long and signal periods must be > 0");
        }

        return longP + signalP - 1;
    }

    @Override
    public Strategy build(BarSeries series, StrategyParameters parameters) {
        MacdParameters macdParameters = (MacdParameters) parameters;

        if (macdParameters == null
                || macdParameters.getShortPeriod() == null
                || macdParameters.getLongPeriod() == null
                || macdParameters.getSignalPeriod() == null) {
            throw new IllegalArgumentException("MACD parameters must not be null");
        }

        int shortP = macdParameters.getShortPeriod();
        int longP = macdParameters.getLongPeriod();
        int signalP = macdParameters.getSignalPeriod();

        if (shortP <= 0 || longP <= 0 || signalP <= 0 || shortP >= longP) {
            throw new IllegalArgumentException("Invalid MACD periods: require 0 < short < long and signal > 0");
        }

        MACDIndicator macd = indicatorProvider.build(
            series,
            shortP,
            longP
        );

        EMAIndicator signalLine = indicatorProvider.buildSignal(macd, signalP);

        Rule entryRule = ruleProvider.buildEntryRule(macd, signalLine);
        Rule exitRule = ruleProvider.buildExitRule(macd, signalLine);

        return new BaseStrategy(entryRule, exitRule);
    }
    
}
