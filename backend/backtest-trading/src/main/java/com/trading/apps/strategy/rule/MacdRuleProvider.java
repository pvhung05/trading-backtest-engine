package com.trading.apps.strategy.rule;

import org.ta4j.core.indicators.MACDIndicator;
import org.ta4j.core.indicators.averages.EMAIndicator;
import org.ta4j.core.rules.CrossedUpIndicatorRule;
import org.ta4j.core.rules.CrossedDownIndicatorRule;
import org.ta4j.core.Rule;
import org.springframework.stereotype.Component;

@Component
public class MacdRuleProvider {
    // Entry when MACD crosses down below Signal line
    public Rule buildEntryRule(MACDIndicator macd, EMAIndicator signal) {
        return new CrossedDownIndicatorRule(macd, signal);
    }

    // Exit when MACD crosses up above Signal line
    public Rule buildExitRule(MACDIndicator macd, EMAIndicator signal) {
        return new CrossedUpIndicatorRule(macd, signal);
    }
    
}
