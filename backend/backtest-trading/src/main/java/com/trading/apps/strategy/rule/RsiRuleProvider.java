package com.trading.apps.strategy.rule;

import org.ta4j.core.indicators.RSIIndicator;
import org.ta4j.core.rules.UnderIndicatorRule;
import org.ta4j.core.rules.OverIndicatorRule;
import org.ta4j.core.Rule;
import org.springframework.stereotype.Component;

@Component
public class RsiRuleProvider {

    // Entry when RSI crosses OVER overbought (exit oversold position)
    public Rule buildEntryRule(RSIIndicator rsi, Double oversold) {
        return new OverIndicatorRule(rsi, oversold);
    }

    // Exit when RSI crosses UNDER oversold (close overbought position)
    public Rule buildExitRule(RSIIndicator rsi, Double overbought) {
        return new UnderIndicatorRule(rsi, overbought);
    }
}
