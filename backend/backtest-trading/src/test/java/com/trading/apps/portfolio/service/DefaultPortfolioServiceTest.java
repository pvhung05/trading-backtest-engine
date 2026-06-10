package com.trading.apps.portfolio.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

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

    @Test
    public void calculate_emptyTradeList_returnsInitialCapitalUnchanged() {
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(10000.0d).build();
        List<ExecutedTrade> trades = new ArrayList<>();

        PortfolioResult result = service.calculate(trades, config);

        Assertions.assertEquals(10000.0d, result.getPortfolio().getCurrentBalance());
        Assertions.assertEquals(10000.0d, result.getPortfolio().getCurrentCash());
        Assertions.assertTrue(result.getSnapshots().isEmpty());
        Assertions.assertEquals(1, result.getEquityCurve().size());
    }

    @Test
    public void calculate_profitableTrades_accumulatesProfitCorrectly() {
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(10000.0d).build();
        List<ExecutedTrade> trades = new ArrayList<>();

        Instant now = Instant.now();

        ExecutedTrade t1 = ExecutedTrade.builder()
                .entryTime(now)
                .exitTime(now)
                .entryPrice(0.0d)
                .exitPrice(0.0d)
                .quantity(0.0d)
                .grossProfit(0.0d)
                .commission(0.0d)
                .slippageCost(0.0d)
                .netProfit(500.0d)
                .build();

        ExecutedTrade t2 = ExecutedTrade.builder()
                .entryTime(now)
                .exitTime(now)
                .entryPrice(0.0d)
                .exitPrice(0.0d)
                .quantity(0.0d)
                .grossProfit(0.0d)
                .commission(0.0d)
                .slippageCost(0.0d)
                .netProfit(300.0d)
                .build();

        ExecutedTrade t3 = ExecutedTrade.builder()
                .entryTime(now)
                .exitTime(now)
                .entryPrice(0.0d)
                .exitPrice(0.0d)
                .quantity(0.0d)
                .grossProfit(0.0d)
                .commission(0.0d)
                .slippageCost(0.0d)
                .netProfit(-200.0d)
                .build();

        trades.add(t1);
        trades.add(t2);
        trades.add(t3);

        PortfolioResult result = service.calculate(trades, config);

        Assertions.assertEquals(10600.0d, result.getPortfolio().getCurrentBalance());
        Assertions.assertEquals(10600.0d, result.getPortfolio().getCurrentCash());
        Assertions.assertEquals(3, result.getSnapshots().size());
        Assertions.assertEquals(4, result.getEquityCurve().size());
    }

    @Test
    public void calculate_invalidInitialCapital_throwsIllegalArgumentException() {
        PortfolioConfig config = PortfolioConfig.builder().initialCapital(0.0d).build();
        List<ExecutedTrade> trades = new ArrayList<>();

        Assertions.assertThrows(IllegalArgumentException.class, () -> service.calculate(trades, config));
    }
}
