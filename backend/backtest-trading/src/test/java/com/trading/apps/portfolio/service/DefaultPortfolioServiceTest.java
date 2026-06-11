package com.trading.apps.portfolio.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.ta4j.core.BaseBar;
import org.ta4j.core.BaseBarSeries;

import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.portfolio.model.PortfolioConfig;
import com.trading.apps.portfolio.model.PortfolioResult;
import com.trading.apps.portfolio.validator.PortfolioValidator;

/**
 * Unit tests for {@link DefaultPortfolioService}.
 */
public class DefaultPortfolioServiceTest {

    private final PortfolioValidator validator = new PortfolioValidator();
    private final DefaultPortfolioService service = new DefaultPortfolioService(validator);

    private BaseBarSeries createSeries(List<Double> closes) {
        BaseBarSeries series = new BaseBarSeries.BaseBarSeriesBuilder()
                .withName("test")
                .build();
        Instant base = Instant.parse("2025-01-01T00:00:00Z");
        for (int i = 0; i < closes.size(); i++) {
            ZonedDateTime time = ZonedDateTime.ofInstant(base.plus(Duration.ofHours(i)), ZoneId.of("UTC"));
            series.addBar(new BaseBar(Duration.ofHours(1), time,
                    BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.valueOf(closes.get(i)),
                    BigDecimal.ZERO));
        }
        return series;
    }

    private ExecutedTrade trade(int entryBar, int exitBar, double netProfit) {
        Instant base = Instant.parse("2025-01-01T00:00:00Z");
        return ExecutedTrade.builder()
                .entryTime(base.plus(Duration.ofHours(entryBar)))
                .exitTime(base.plus(Duration.ofHours(exitBar)))
                .entryPrice(100.0)
                .exitPrice(100.0)
                .quantity(1.0)
                .grossProfit(netProfit)
                .commission(0.0)
                .slippageCost(0.0)
                .netProfit(netProfit)
                .build();
    }

    @Test
    public void calculate_emptyTradeList_returnsInitialCapitalUnchanged() {
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(10000.0d).build();
        List<ExecutedTrade> trades = new ArrayList<>();
        BaseBarSeries series = createSeries(List.of(100.0, 105.0, 110.0));

        PortfolioResult result = service.calculate(trades, series, config);

        Assertions.assertEquals(10000.0d, result.getPortfolio().getCurrentBalance());
        Assertions.assertEquals(10000.0d, result.getPortfolio().getCurrentCash());
        Assertions.assertTrue(result.getSnapshots().isEmpty());
        Assertions.assertEquals(3, result.getEquityCurve().size());
    }

    @Test
    public void calculate_oneTrade_equityCurveWithOpenPositionMarked() {
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(10000.0d).build();
        List<ExecutedTrade> trades = List.of(trade(0, 2, 200.0));
        BaseBarSeries series = createSeries(List.of(100.0, 105.0, 110.0));

        PortfolioResult result = service.calculate(trades, series, config);

        Assertions.assertEquals(10200.0d, result.getPortfolio().getCurrentBalance());
        Assertions.assertEquals(10200.0d, result.getPortfolio().getCurrentCash());
        Assertions.assertEquals(1, result.getSnapshots().size());

        // Bar 0: position opened, equity = cash + (100-100)*qty = 10000
        Assertions.assertFalse(result.getEquityCurve().get(0).isOpenPosition());
        Assertions.assertEquals(10000.0, result.getEquityCurve().get(0).getEquity());

        // Bar 1: position still open, close=105, equity = 10000 + (105-100)*1 = 10005
        Assertions.assertTrue(result.getEquityCurve().get(1).isOpenPosition());
        Assertions.assertEquals(10005.0, result.getEquityCurve().get(1).getEquity());
        Assertions.assertEquals(5.0, result.getEquityCurve().get(1).getOpenPositionPnl());

        // Bar 2: trade closed, equity = 10000 + 200 = 10200
        Assertions.assertFalse(result.getEquityCurve().get(2).isOpenPosition());
        Assertions.assertEquals(10200.0, result.getEquityCurve().get(2).getEquity());
    }

    @Test
    public void calculate_profitableTrades_accumulatesProfitCorrectly() {
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(10000.0d).build();
        List<ExecutedTrade> trades = List.of(
                trade(0, 1, 500.0),
                trade(1, 2, 300.0),
                trade(2, 3, -200.0));
        BaseBarSeries series = createSeries(List.of(100.0, 105.0, 103.0, 98.0));

        PortfolioResult result = service.calculate(trades, series, config);

        Assertions.assertEquals(10600.0d, result.getPortfolio().getCurrentBalance());
        Assertions.assertEquals(10600.0d, result.getPortfolio().getCurrentCash());
        Assertions.assertEquals(3, result.getSnapshots().size());
        Assertions.assertEquals(4, result.getEquityCurve().size());
    }

    @Test
    public void calculate_invalidInitialCapital_throwsIllegalArgumentException() {
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(0.0d).build();
        List<ExecutedTrade> trades = new ArrayList<>();
        BaseBarSeries series = createSeries(List.of(100.0));

        Assertions.assertThrows(IllegalArgumentException.class,
                () -> service.calculate(trades, series, config));
    }
}
