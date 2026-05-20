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
import org.springframework.util.StopWatch;
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

        assumeTrue(Boolean.parseBoolean(
                System.getProperty(ENABLE_PROPERTY, "false")),
                "Set -DrunMarketIntegrationTests=true to run this test against Binance"
        );

        MarketDataRequest request = new MarketDataRequest(
                "BTCUSDT",
                "1d",
                Instant.parse("2020-01-01T00:00:00Z"),
                Instant.parse("2022-01-01T06:00:00Z")
        );

        StopWatch watch = new StopWatch();

        watch.start("Load Market Data");

        BarSeries series = marketDataService.load(request);

        watch.stop();

        assertNotNull(series, "BarSeries should not be null");

        assertTrue(series.getBarCount() > 0,
                "BarSeries should contain at least one bar");

        System.out.println();
        System.out.println("=== PERFORMANCE ===");
        System.out.println("Execution time: "
                + watch.getTotalTimeMillis()
                + " ms");

        System.out.println("Execution time: "
                + watch.getTotalTimeSeconds()
                + " seconds");

        System.out.println("===================");

        printSeriesSummary(request, series);

        printFirstAndLastBars(series, 5);
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

    private void printFirstAndLastBars(BarSeries series, int sideCount) {
        int totalBars = series.getBarCount();
        
        System.out.println("\n=== FIRST " + sideCount + " BARS ===");
        System.out.println("Idx | End time              | Open      | High      | Low       | Close     | Volume");
        System.out.println("----+-----------------------+-----------+-----------+-----------+-----------+-----------");
        
        for (int i = 0; i < Math.min(sideCount, totalBars); i++) {
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
        
        if (totalBars > 2 * sideCount) {
            System.out.println("... (" + (totalBars - 2 * sideCount) + " bars omitted) ...");
        }
        
        System.out.println("\n=== LAST " + sideCount + " BARS ===");
        System.out.println("Idx | End time              | Open      | High      | Low       | Close     | Volume");
        System.out.println("----+-----------------------+-----------+-----------+-----------+-----------+-----------");
        
        int startIdx = Math.max(0, totalBars - sideCount);
        for (int i = startIdx; i < totalBars; i++) {
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
    }

    @Test
    @DisplayName("Test cache performance - same request twice")
    void testCachePerformance() {
        assumeTrue(Boolean.parseBoolean(
                System.getProperty(ENABLE_PROPERTY, "false")),
                "Set -DrunMarketIntegrationTests=true to test cache performance"
        );

        MarketDataRequest request = new MarketDataRequest(
                "BTCUSDT",
                "1d",
                Instant.parse("2020-01-01T00:00:00Z"),
                Instant.parse("2022-01-01T06:00:00Z")
        );

        System.out.println();
        System.out.println("=== CACHE PERFORMANCE TEST ===");
        System.out.println("Initial cache size: " + marketDataService.getCacheSize());

        // First call - should load from Binance
        long start1 = System.currentTimeMillis();
        BarSeries series1 = marketDataService.load(request);
        long time1 = System.currentTimeMillis() - start1;

        System.out.println("1st call (cache miss): " + time1 + " ms");
        System.out.println("Cache size after 1st call: " + marketDataService.getCacheSize());
        System.out.println("Bars loaded: " + series1.getBarCount());

        // Second call - should load from cache
        long start2 = System.currentTimeMillis();
        BarSeries series2 = marketDataService.load(request);
        long time2 = System.currentTimeMillis() - start2;

        System.out.println("2nd call (cache hit): " + time2 + " ms");
        System.out.println("Cache size after 2nd call: " + marketDataService.getCacheSize());

        // Performance comparison
        System.out.println();
        if (time2 > 0) {
            long improvement = time1 - time2;
            double percentage = (double) improvement * 100 / time1;
            double speedup = (double) time1 / time2;
            System.out.println("Time saved: " + improvement + " ms (" + String.format("%.1f%%", percentage) + ")");
            System.out.println("Speedup: " + String.format("%.2fx", speedup));
        }
        System.out.println("=============================");

        assertTrue(series1.getBarCount() == series2.getBarCount(), "Both calls should return same data");
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