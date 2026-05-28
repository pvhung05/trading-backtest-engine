package com.trading.apps.strategy.rule;

import org.ta4j.core.indicators.RSIIndicator;
import org.ta4j.core.rules.UnderIndicatorRule;
import org.ta4j.core.rules.OverIndicatorRule;
import org.ta4j.core.Rule;
import org.springframework.stereotype.Component;

@Component
public class RsiRuleProvider {

    public Rule buildEntryRule(RSIIndicator rsi, Double oversold) {
        return new UnderIndicatorRule(rsi, oversold);
    }

    public Rule buildExitRule(RSIIndicator rsi, Double overbought) {
        return new OverIndicatorRule(rsi, overbought);
    }
}
