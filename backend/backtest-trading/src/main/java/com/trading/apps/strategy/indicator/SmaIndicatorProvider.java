package com.trading.apps.strategy.indicator;
import org.ta4j.core.indicators.averages.SMAIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.springframework.stereotype.Component;
import org.ta4j.core.BarSeries;

@Component
public class SmaIndicatorProvider {

    public SMAIndicator build(BarSeries series, Integer period) {
        ClosePriceIndicator closePrice = new ClosePriceIndicator(series);
        return new SMAIndicator(closePrice, period);
    }
    
}
