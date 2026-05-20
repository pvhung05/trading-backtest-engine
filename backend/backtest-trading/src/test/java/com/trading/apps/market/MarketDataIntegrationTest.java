package com.trading.apps.market;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.time.Instant;
import java.time.format.DateTimeFormatter;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.ta4j.core.Bar;
import org.ta4j.core.BarSeries;

import com.trading.TradingApplication;
import com.trading.apps.market.model.MarketDataRequest;
import com.trading.apps.market.service.MarketDataService;

@SpringBootTest(classes = TradingApplication.class)
class MarketDataIntegrationTest {

    private static final String ENABLE_PROPERTY = "runMarketIntegrationTests";
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ISO_INSTANT;

    @Autowired
    private MarketDataService marketDataService;

    @Test
    @DisplayName("Print real market data from Binance")
    void shouldLoadRealMarketDataFromBinance() {
        assumeTrue(Boolean.parseBoolean(System.getProperty(ENABLE_PROPERTY, "false")),
                "Set -DrunMarketIntegrationTests=true to run this test against Binance");

        MarketDataRequest request = new MarketDataRequest(
                "BTCUSDT",
                "1d",
                Instant.parse("2024-01-01T00:00:00Z"),
                Instant.parse("2025-01-01T06:00:00Z")
        );

        BarSeries series = marketDataService.load(request);

        assertNotNull(series, "BarSeries should not be null");
        assertTrue(series.getBarCount() > 0, "BarSeries should contain at least one bar");

        printSeriesSummary(request, series);
        printSampleBars(series, 5);
    }

    private void printSeriesSummary(MarketDataRequest request, BarSeries series) {
        Bar firstBar = series.getBar(0);
        Bar lastBar = series.getBar(series.getBarCount() - 1);

        System.out.println();
        System.out.println("=== BINANCE MARKET DATA SAMPLE ===");
        System.out.println("Request   : " + request);
        System.out.println("Series    : " + series.getName());
        System.out.println("Bars      : " + series.getBarCount());
        System.out.println("First bar : " + formatBar(firstBar));
        System.out.println("Last bar  : " + formatBar(lastBar));
        System.out.println("==================================");
    }

    private void printSampleBars(BarSeries series, int maxBars) {
        int count = Math.min(maxBars, series.getBarCount());

        System.out.println("Idx | End time              | Open      | High      | Low       | Close     | Volume");
        System.out.println("----+-----------------------+-----------+-----------+-----------+-----------+-----------");

        for (int i = 0; i < count; i++) {
            Bar bar = series.getBar(i);
            System.out.printf(
                    "%3d | %-21s | %9.2f | %9.2f | %9.2f | %9.2f | %9.2f%n",
                    i,
                    TIME_FORMAT.format(bar.getEndTime()),
                    bar.getOpenPrice().doubleValue(),
                    bar.getHighPrice().doubleValue(),
                    bar.getLowPrice().doubleValue(),
                    bar.getClosePrice().doubleValue(),
                    bar.getVolume().doubleValue()
            );
        }

        if (series.getBarCount() > count) {
            System.out.println("... truncated, total bars: " + series.getBarCount());
        }
    }

    private String formatBar(Bar bar) {
        return String.format("%s | O=%.2f H=%.2f L=%.2f C=%.2f V=%.2f",
                TIME_FORMAT.format(bar.getEndTime()),
                bar.getOpenPrice().doubleValue(),
                bar.getHighPrice().doubleValue(),
                bar.getLowPrice().doubleValue(),
                bar.getClosePrice().doubleValue(),
                bar.getVolume().doubleValue());
    }
}