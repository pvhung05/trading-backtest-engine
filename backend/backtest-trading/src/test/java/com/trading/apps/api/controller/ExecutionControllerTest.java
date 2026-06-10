package com.trading.apps.api.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.trading.apps.api.controller.execution.ExecutionController;
import com.trading.apps.api.mapper.execution.ExecutionSimulationResponseMapper;
import com.trading.apps.api.request.execution.ExecutionSimulationRequest;
import com.trading.apps.api.response.execution.ExecutionSimulationResponse;
import com.trading.apps.execution.model.ExecutionSimulationCommand;
import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.execution.service.ExecutionSimulationService;
import com.trading.apps.strategy.enums.StrategyType;

class ExecutionControllerTest {

    @Test
    void shouldReturnExecutedTradesAsJson() {
        ExecutionSimulationService executionSimulationService = mock(ExecutionSimulationService.class);
        ExecutionController controller = new ExecutionController(executionSimulationService,
                new ExecutionSimulationResponseMapper());

        ExecutionSimulationRequest request = new ExecutionSimulationRequest();
        request.setSymbol("BTCUSDT");
        request.setTimeframe("1d");
        request.setStartTime("2026-01-01T00:00:00Z");
        request.setStrategyType(StrategyType.SMA_CROSS);
        request.setShortPeriod(10);
        request.setLongPeriod(50);
        request.setCommissionRate(0.001d);
        request.setSlippageRate(0.01d);
        request.setPositionSizePercent(25.0d);
        request.setCapital(10_000.0d);

        List<ExecutedTrade> executedTrades = List.of(ExecutedTrade.builder()
                .entryTime(Instant.parse("2026-01-01T01:00:00Z"))
                .exitTime(Instant.parse("2026-01-02T01:00:00Z"))
                .entryPrice(101.0d)
                .exitPrice(118.8d)
                .quantity(24.75d)
                .grossProfit(440.59d)
                .commission(5.44d)
                .slippageCost(54.45d)
                .netProfit(435.15d)
                .build());

        when(executionSimulationService.execute(any(ExecutionSimulationCommand.class))).thenReturn(executedTrades);

        ResponseEntity<ExecutionSimulationResponse> response = controller.getExecutedTrades(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("BTCUSDT", response.getBody().symbol());
        assertEquals("SMA_CROSS", response.getBody().strategyType());
        assertEquals(1, response.getBody().tradeCount());
        assertEquals("2026-01-01T01:00:00Z", response.getBody().trades().get(0).entryTime());
        assertEquals(435.15d, response.getBody().trades().get(0).netProfit());
    }

    @Test
    void shouldRejectMissingExecutionParameters() {
        ExecutionSimulationRequest request = new ExecutionSimulationRequest();
        request.setSymbol("BTCUSDT");
        request.setTimeframe("1d");
        request.setStartTime("2026-01-01T00:00:00Z");
        request.setStrategyType(StrategyType.SMA_CROSS);
        request.setShortPeriod(10);
        request.setLongPeriod(50);

        IllegalArgumentException exception = org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                request::toDomainCommand);

        assertEquals("commissionRate is required", exception.getMessage());
    }
}