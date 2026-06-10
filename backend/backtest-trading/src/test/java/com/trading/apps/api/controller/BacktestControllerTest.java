package com.trading.apps.api.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.trading.apps.api.controller.backtest.BacktestController;
import com.trading.apps.api.mapper.backtest.BacktestTradingRecordResponseMapper;
import com.trading.apps.api.request.backtest.BacktestTradingRecordRequest;
import com.trading.apps.api.response.backtest.BacktestTradingRecordResponse;
import com.trading.apps.backtest.model.BacktestCommand;
import com.trading.apps.backtest.model.BacktestResult;
import com.trading.apps.backtest.model.Trade;
import com.trading.apps.backtest.service.BacktestService;
import com.trading.apps.strategy.enums.StrategyType;

class BacktestControllerTest {

    @Test
    void shouldReturnTradingRecordChainAsJson() {
        BacktestService backtestService = mock(BacktestService.class);
        BacktestController controller = new BacktestController(backtestService,
                new BacktestTradingRecordResponseMapper());

        BacktestTradingRecordRequest request = new BacktestTradingRecordRequest();
        request.setSymbol("BTCUSDT");
        request.setTimeframe("5m");
        request.setStartTime("2024-01-01T00:00:00Z");
        request.setEndTime("2024-01-01T01:00:00Z");
        request.setStrategyType(StrategyType.SMA_CROSS);
        request.setShortPeriod(10);
        request.setLongPeriod(50);

        BacktestResult result = BacktestResult.builder()
                .trade(Trade.builder()
                        .entryTime(Instant.parse("2024-01-01T00:05:00Z"))
                        .entryPrice(100.0d)
                        .exitTime(Instant.parse("2024-01-01T00:10:00Z"))
                        .exitPrice(110.0d)
                        .profitPercent(10.0d)
                        .build())
                .build();

        when(backtestService.execute(any(BacktestCommand.class))).thenReturn(result);

        ResponseEntity<BacktestTradingRecordResponse> response = controller.getTradingRecords(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("BTCUSDT", response.getBody().symbol());
        assertEquals("SMA_CROSS", response.getBody().strategyType());
        assertEquals(1, response.getBody().tradeCount());
        assertEquals("2024-01-01T00:05:00Z", response.getBody().trades().get(0).entryTime());
        assertEquals(110.0d, response.getBody().trades().get(0).exitPrice());
    }

    @Test
    void shouldRejectMissingStrategyParameters() {
        BacktestService backtestService = mock(BacktestService.class);
        new BacktestController(backtestService,
                new BacktestTradingRecordResponseMapper());

        BacktestTradingRecordRequest request = new BacktestTradingRecordRequest();
        request.setSymbol("BTCUSDT");
        request.setTimeframe("5m");
        request.setStartTime("2024-01-01T00:00:00Z");
        request.setEndTime("2024-01-01T01:00:00Z");
        request.setStrategyType(StrategyType.MACD);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                request::toDomainCommand);

        assertEquals("shortPeriod is required", exception.getMessage());
    }
}