package com.trading.apps.api.mapper.market;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;

import com.trading.apps.api.response.market.MarketBarResponse;
import com.trading.apps.api.response.market.MarketDataResponse;
import com.trading.apps.market.model.MarketDataRequest;

/**
 * Maps domain market data objects to API response DTOs.
 */
@Component
public class MarketDataResponseMapper {

    public MarketDataResponse toResponse(MarketDataRequest request, BarSeries series) {
        List<MarketBarResponse> bars = new ArrayList<>(series.getBarCount());

        for (int i = 0; i < series.getBarCount(); i++) {
            Bar bar = series.getBar(i);
            bars.add(new MarketBarResponse(
                    bar.getEndTime().toString(),
                    bar.getOpenPrice().doubleValue(),
                    bar.getHighPrice().doubleValue(),
                    bar.getLowPrice().doubleValue(),
                    bar.getClosePrice().doubleValue(),
                    bar.getVolume().doubleValue()
            ));
        }

        return new MarketDataResponse(
                request.getSymbol(),
                request.getTimeframe(),
                request.getStartTime().toString(),
                request.getEndTime().toString(),
                series.getBarCount(),
                bars
        );
    }
}