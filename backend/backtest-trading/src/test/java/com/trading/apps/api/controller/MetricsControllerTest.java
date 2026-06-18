package com.trading.apps.api.controller;

import java.util.List;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.trading.apps.api.controller.metrics.MetricsController;
import com.trading.apps.api.mapper.metrics.MetricsSimulationResponseMapper;
import com.trading.apps.api.request.metrics.MetricsSimulationRequest;
import com.trading.apps.api.response.execution.ExecutedTradeResponse;
import com.trading.apps.api.response.metrics.MetricsSimulationResponse;
import com.trading.apps.api.response.portfolio.EquityCurvePointResponse;
import com.trading.apps.api.response.portfolio.EquityCurveResponse;
import com.trading.apps.api.response.portfolio.PortfolioStatsResponse;
import com.trading.apps.metrics.model.MetricsResult;
import com.trading.apps.metrics.service.MetricsService;
import com.trading.apps.portfolio.model.PortfolioResult;

@ExtendWith(MockitoExtension.class)
public class MetricsControllerTest {

    @Mock
    private MetricsService metricsService;

    private MetricsController controller;
    private MetricsSimulationResponseMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new MetricsSimulationResponseMapper();
        controller = new MetricsController(metricsService, mapper);
    }

    @Test
    void calculate_withValidRequest_returnsOk() {
        MetricsSimulationRequest request = buildRequest();

        MetricsResult domainResult = MetricsResult.builder()
                .initialCapital(10000.0)
                .finalBalance(11500.0)
                .totalReturnPercent(15.0)
                .totalTrades(3)
                .winningTrades(2)
                .losingTrades(1)
                .winRate(0.667)
                .profitFactor(2.5)
                .averageWin(250.0)
                .averageLoss(100.0)
                .bestTrade(300.0)
                .worstTrade(-100.0)
                .maxConsecutiveWins(2)
                .maxConsecutiveLosses(1)
                .expectancy(116.67)
                .rewardRiskRatio(2.5)
                .maxDrawdown(10.0)
                .recoveryFactor(1.5)
                .sharpeRatio(1.2)
                .sortinoRatio(1.5)
                .calmarRatio(1.5)
                .cagr(15.0)
                .build();

        org.mockito.Mockito.when(metricsService.calculate(
                org.mockito.Mockito.anyList(),
                org.mockito.Mockito.any(PortfolioResult.class)))
                .thenReturn(domainResult);

        ResponseEntity<MetricsSimulationResponse> response = controller.calculate(request);

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertNotNull(response.getBody());
        Assertions.assertEquals(10000.0, response.getBody().initialCapital());
        Assertions.assertEquals(11500.0, response.getBody().finalBalance());
        Assertions.assertEquals(15.0, response.getBody().totalReturnPercent());
        Assertions.assertEquals(3, response.getBody().totalTrades());
        Assertions.assertEquals(2, response.getBody().winningTrades());
        Assertions.assertEquals(1, response.getBody().losingTrades());
        Assertions.assertEquals(0.667, response.getBody().winRate());
        Assertions.assertEquals(2.5, response.getBody().profitFactor());
        Assertions.assertEquals(250.0, response.getBody().averageWin());
        Assertions.assertEquals(100.0, response.getBody().averageLoss());
        Assertions.assertEquals(300.0, response.getBody().bestTrade());
        Assertions.assertEquals(-100.0, response.getBody().worstTrade());
        Assertions.assertEquals(2, response.getBody().maxConsecutiveWins());
        Assertions.assertEquals(1, response.getBody().maxConsecutiveLosses());
        Assertions.assertEquals(116.67, response.getBody().expectancy());
        Assertions.assertEquals(2.5, response.getBody().rewardRiskRatio());
        Assertions.assertEquals(10.0, response.getBody().maxDrawdown());
        Assertions.assertEquals(1.5, response.getBody().recoveryFactor());
        Assertions.assertEquals(1.2, response.getBody().sharpeRatio());
        Assertions.assertEquals(1.5, response.getBody().sortinoRatio());
        Assertions.assertEquals(1.5, response.getBody().calmarRatio());
        Assertions.assertEquals(15.0, response.getBody().cagr());
    }

    @Test
    void calculate_withEmptyTrades_returnsZeroMetrics() {
        MetricsSimulationRequest request = buildRequest();
        request.setTrades(List.of());

        MetricsResult domainResult = MetricsResult.builder()
                .initialCapital(10000.0)
                .finalBalance(10000.0)
                .totalReturnPercent(0.0)
                .totalTrades(0)
                .winningTrades(0)
                .losingTrades(0)
                .winRate(0.0)
                .profitFactor(0.0)
                .averageWin(0.0)
                .averageLoss(0.0)
                .bestTrade(0.0)
                .worstTrade(0.0)
                .maxConsecutiveWins(0)
                .maxConsecutiveLosses(0)
                .expectancy(0.0)
                .rewardRiskRatio(0.0)
                .maxDrawdown(0.0)
                .recoveryFactor(0.0)
                .sharpeRatio(0.0)
                .sortinoRatio(0.0)
                .calmarRatio(0.0)
                .cagr(0.0)
                .build();

        org.mockito.Mockito.when(metricsService.calculate(
                org.mockito.Mockito.anyList(),
                org.mockito.Mockito.any(PortfolioResult.class)))
                .thenReturn(domainResult);

        ResponseEntity<MetricsSimulationResponse> response = controller.calculate(request);

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
        Assertions.assertNotNull(response.getBody());
        Assertions.assertEquals(0, response.getBody().totalTrades());
        Assertions.assertEquals(0, response.getBody().winningTrades());
        Assertions.assertEquals(0, response.getBody().losingTrades());
    }

    @Test
    void calculate_withNullTrades_handlesGracefully() {
        MetricsSimulationRequest request = buildRequest();
        request.setTrades(null);

        MetricsResult domainResult = MetricsResult.builder()
                .initialCapital(10000.0)
                .finalBalance(10000.0)
                .totalReturnPercent(0.0)
                .totalTrades(0)
                .winningTrades(0)
                .losingTrades(0)
                .winRate(0.0)
                .profitFactor(0.0)
                .averageWin(0.0)
                .averageLoss(0.0)
                .bestTrade(0.0)
                .worstTrade(0.0)
                .maxConsecutiveWins(0)
                .maxConsecutiveLosses(0)
                .expectancy(0.0)
                .rewardRiskRatio(0.0)
                .maxDrawdown(0.0)
                .recoveryFactor(0.0)
                .sharpeRatio(0.0)
                .sortinoRatio(0.0)
                .calmarRatio(0.0)
                .cagr(0.0)
                .build();

        org.mockito.Mockito.when(metricsService.calculate(
                org.mockito.Mockito.anyList(),
                org.mockito.Mockito.any(PortfolioResult.class)))
                .thenReturn(domainResult);

        ResponseEntity<MetricsSimulationResponse> response = controller.calculate(request);

        Assertions.assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    private MetricsSimulationRequest buildRequest() {
        List<ExecutedTradeResponse> trades = List.of(
                new ExecutedTradeResponse(
                        "2025-01-01T00:00:00Z",
                        "2025-01-02T00:00:00Z",
                        100.0, 110.0, 1.0,
                        10.0, 0.1, 0.05, 9.85),
                new ExecutedTradeResponse(
                        "2025-01-03T00:00:00Z",
                        "2025-01-04T00:00:00Z",
                        110.0, 115.0, 1.0,
                        5.0, 0.1, 0.05, 4.85),
                new ExecutedTradeResponse(
                        "2025-01-05T00:00:00Z",
                        "2025-01-06T00:00:00Z",
                        115.0, 105.0, 1.0,
                        -10.0, 0.1, 0.05, -10.15));

        List<EquityCurvePointResponse> points = List.of(
                new EquityCurvePointResponse("2025-01-01T00:00:00Z", 10000.0, false, 0.0),
                new EquityCurvePointResponse("2025-01-02T00:00:00Z", 10009.85, true, 9.85),
                new EquityCurvePointResponse("2025-01-03T00:00:00Z", 10009.85, false, 0.0),
                new EquityCurvePointResponse("2025-01-04T00:00:00Z", 10014.7, true, 4.85),
                new EquityCurvePointResponse("2025-01-05T00:00:00Z", 10014.7, false, 0.0),
                new EquityCurvePointResponse("2025-01-06T00:00:00Z", 10004.55, false, 0.0));

        EquityCurveResponse equityCurve = new EquityCurveResponse(points);
        PortfolioStatsResponse stats = new PortfolioStatsResponse(
                10000.0, 10004.55, 4.55, 0.0455, 3);

        MetricsSimulationRequest request = new MetricsSimulationRequest();
        request.setTrades(trades);
        request.setEquityCurve(equityCurve);
        request.setStats(stats);
        return request;
    }
}
