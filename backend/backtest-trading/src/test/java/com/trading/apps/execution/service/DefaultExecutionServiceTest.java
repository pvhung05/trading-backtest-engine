package com.trading.apps.execution.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.ta4j.core.BarSeries;
import org.ta4j.core.TradingRecord;

import com.trading.apps.execution.calculator.CommissionCalculator;
import com.trading.apps.execution.calculator.QuantityCalculator;
import com.trading.apps.execution.calculator.SlippageCalculator;
import com.trading.apps.execution.mapper.TradingRecordMapper;
import com.trading.apps.execution.model.ExecutionConfig;
import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.execution.model.TradeExecution;

@ExtendWith(MockitoExtension.class)
class DefaultExecutionServiceTest {

    @Mock
    private TradingRecordMapper tradingRecordMapper;

    @Mock
    private TradingRecord tradingRecord;

    @Mock
    private BarSeries barSeries;

    private DefaultExecutionService service;

    @BeforeEach
    void setUp() {
        service = new DefaultExecutionService(
                tradingRecordMapper,
                new CommissionCalculator(),
                new SlippageCalculator(),
                new QuantityCalculator());
    }

    @Test
    void shouldSimulateExecutedTradeFromMappedTradeExecution() {
        Instant entryTime = Instant.parse("2024-01-01T00:00:00Z");
        Instant exitTime = Instant.parse("2024-01-02T00:00:00Z");
        TradeExecution tradeExecution = TradeExecution.builder()
                .entryTime(entryTime)
                .exitTime(exitTime)
                .entryPrice(100.0d)
                .exitPrice(120.0d)
                .build();

        ExecutionConfig config = ExecutionConfig.builder()
                .commissionRate(0.001d)
                .slippageRate(0.01d)
                .positionSizePercent(25.0d)
                .build();

        when(tradingRecordMapper.toTradeExecutions(tradingRecord, barSeries)).thenReturn(List.of(tradeExecution));

        List<ExecutedTrade> result = service.execute(tradingRecord, barSeries, config, 10_000.0d);

        assertEquals(1, result.size());

        ExecutedTrade executedTrade = result.get(0);
        assertSame(entryTime, executedTrade.getEntryTime());
        assertSame(exitTime, executedTrade.getExitTime());
        assertEquals(101.0d, executedTrade.getEntryPrice(), 1e-9);
        assertEquals(118.8d, executedTrade.getExitPrice(), 1e-9);
        assertEquals(24.752475247524753d, executedTrade.getQuantity(), 1e-9);
        assertEquals(440.59405940594057d, executedTrade.getGrossProfit(), 1e-9);
        assertEquals(5.440594059405941d, executedTrade.getCommission(), 1e-9);
        assertEquals(54.45544554455446d, executedTrade.getSlippageCost(), 1e-9);
        assertEquals(435.15346534653463d, executedTrade.getNetProfit(), 1e-9);
    }
}