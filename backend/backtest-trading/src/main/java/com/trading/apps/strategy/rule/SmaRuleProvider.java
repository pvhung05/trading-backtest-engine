package com.trading.apps.strategy.rule;

import org.ta4j.core.indicators.averages.SMAIndicator;
import org.ta4j.core.rules.CrossedUpIndicatorRule;
import org.ta4j.core.rules.CrossedDownIndicatorRule;
import org.ta4j.core.Rule;
import org.springframework.stereotype.Component;

@Component
public class SmaRuleProvider {

    // Entry when short SMA crosses up above long SMA
    public Rule buildEntryRule(SMAIndicator shortSma, SMAIndicator longSma) {
        return new CrossedUpIndicatorRule(shortSma, longSma);
    }

    // Exit when short SMA crosses down below long SMA
    public Rule buildExitRule(SMAIndicator shortSma, SMAIndicator longSma) {
        return new CrossedDownIndicatorRule(shortSma, longSma);
    }
}
