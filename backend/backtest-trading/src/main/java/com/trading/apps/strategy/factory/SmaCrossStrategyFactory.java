package com.trading.apps.strategy.factory;

import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.strategy.model.SmaCrossParameters;
import com.trading.apps.strategy.model.StrategyParameters;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import org.ta4j.core.BarSeries;
import org.ta4j.core.BaseStrategy;
import org.ta4j.core.Strategy;
import org.ta4j.core.Rule;
import com.trading.apps.strategy.rule.SmaRuleProvider;
import com.trading.apps.strategy.indicator.SmaIndicatorProvider;

import org.ta4j.core.indicators.averages.SMAIndicator;



@Component
@RequiredArgsConstructor
public class SmaCrossStrategyFactory implements TradingStrategyFactory {

    private final SmaRuleProvider ruleProvider;
    private final SmaIndicatorProvider indicatorProvider;

    @Override
    public StrategyType getType() {
        return StrategyType.SMA_CROSS;
    }

    @Override
    public int getRequiredWarmupBars(StrategyParameters parameters) {
        SmaCrossParameters smaCrossParameters = (SmaCrossParameters) parameters;
        if (smaCrossParameters == null || smaCrossParameters.getLongPeriod() == null) {
            throw new IllegalArgumentException("SMA cross parameters must not be null");
        }

        int longP = smaCrossParameters.getLongPeriod();
        if (longP <= 0) {
            throw new IllegalArgumentException("SMA long period must be > 0");
        }

        return longP;
    }

    @Override
    public Strategy build(BarSeries series, StrategyParameters parameters) {

        SmaCrossParameters smaCrossParameters = (SmaCrossParameters) parameters;
        if (smaCrossParameters == null
                || smaCrossParameters.getShortPeriod() == null
                || smaCrossParameters.getLongPeriod() == null) {
            throw new IllegalArgumentException("SMA cross parameters must not be null");
        }

        int shortP = smaCrossParameters.getShortPeriod();
        int longP = smaCrossParameters.getLongPeriod();

        if (shortP <= 0 || longP <= 0 || shortP >= longP) {
            throw new IllegalArgumentException("Invalid SMA periods: require 0 < short < long");
        }

        SMAIndicator longSma = indicatorProvider.build(series, longP);
        SMAIndicator shortSma = indicatorProvider.build(series, shortP);

        Rule entryRule = ruleProvider.buildEntryRule(longSma, shortSma);
        Rule exitRule = ruleProvider.buildExitRule(longSma, shortSma);

        return new BaseStrategy(entryRule, exitRule);
    }
    
}
