package com.trading.apps.strategy.factory;

import com.trading.apps.strategy.enums.StrategyType;
import com.trading.apps.strategy.model.StrategyParameters;
import org.springframework.stereotype.Component;
import com.trading.apps.strategy.model.RsiParameters;
import org.ta4j.core.BaseStrategy;
import org.ta4j.core.Rule;
import org.ta4j.core.indicators.RSIIndicator;
import com.trading.apps.strategy.indicator.RsiIndicatorProvider;
import com.trading.apps.strategy.rule.RsiRuleProvider;
import org.ta4j.core.BarSeries;
import lombok.RequiredArgsConstructor;
import org.ta4j.core.Strategy;


@Component
@RequiredArgsConstructor
public class RsiStrategyFactory implements TradingStrategyFactory {
    private final RsiIndicatorProvider indicatorProvider;
    private final RsiRuleProvider ruleProvider;

    @Override
    public StrategyType getType() {
        return StrategyType.RSI;
    }

    @Override
    public int getRequiredWarmupBars(StrategyParameters parameters) {
        RsiParameters rsiParameters = (RsiParameters) parameters;
        if (rsiParameters == null || rsiParameters.getPeriod() == null) {
            throw new IllegalArgumentException("RSI parameters must not be null");
        }

        int period = rsiParameters.getPeriod();
        if (period <= 0) {
            throw new IllegalArgumentException("RSI period must be > 0");
        }

        return period;
    }

    @Override
    public Strategy build(BarSeries series, StrategyParameters parameters) {
        RsiParameters rsiParameters = (RsiParameters) parameters;
        if (rsiParameters == null || rsiParameters.getPeriod() == null) {
            throw new IllegalArgumentException("RSI parameters must not be null");
        }

        int period = rsiParameters.getPeriod();
        Double overbought = rsiParameters.getOverbought();
        Double oversold = rsiParameters.getOversold();

        if (period <= 0) {
            throw new IllegalArgumentException("RSI period must be > 0");
        }
        if (overbought == null || oversold == null) {
            throw new IllegalArgumentException("RSI thresholds must not be null");
        }
        if (oversold < 0 || oversold > 100 || overbought < 0 || overbought > 100) {
            throw new IllegalArgumentException("RSI thresholds must be in [0,100]");
        }
        if (oversold >= overbought) {
            throw new IllegalArgumentException("RSI oversold must be less than overbought");
        }

        RSIIndicator rsi = indicatorProvider.build(series, period);

        Rule entryRule = ruleProvider.buildEntryRule(rsi, oversold);
        Rule exitRule = ruleProvider.buildExitRule(rsi, overbought);

        return new BaseStrategy(entryRule, exitRule);
    }
    
}