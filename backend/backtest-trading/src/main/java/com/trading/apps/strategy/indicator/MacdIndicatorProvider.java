package com.trading.apps.strategy.indicator;
import org.ta4j.core.indicators.MACDIndicator;
import org.ta4j.core.indicators.helpers.ClosePriceIndicator;
import org.ta4j.core.indicators.averages.EMAIndicator;
import org.springframework.stereotype.Component;
import org.ta4j.core.BarSeries;

@Component
public class MacdIndicatorProvider {

    public MACDIndicator build(
        BarSeries series, 
        Integer shortPeriod, 
        Integer longPeriod
    ) {
        ClosePriceIndicator closePrice = new ClosePriceIndicator(series);
        return new MACDIndicator(closePrice, shortPeriod, longPeriod);
    }

    public EMAIndicator buildSignal(MACDIndicator macd, Integer signalPeriod) {
        return new EMAIndicator(macd, signalPeriod);
    }
    
}
