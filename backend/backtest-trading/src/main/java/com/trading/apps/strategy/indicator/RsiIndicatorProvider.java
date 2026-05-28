package com.trading.apps.strategy.indicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.indicators.RSIIndicator;
import org.springframework.stereotype.Component;
import org.ta4j.core.BarSeries;

@Component
public class RsiIndicatorProvider {

    public RSIIndicator build(BarSeries series, Integer period) {
        ClosePriceIndicator closePrice = new ClosePriceIndicator(series);
        return new RSIIndicator(closePrice, period);
    }
    
}
