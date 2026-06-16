package com.trading.apps.api.controller.metrics;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trading.apps.api.mapper.metrics.MetricsSimulationResponseMapper;
import com.trading.apps.api.request.metrics.MetricsSimulationRequest;
import com.trading.apps.api.response.metrics.MetricsSimulationResponse;
import com.trading.apps.execution.model.ExecutedTrade;
import com.trading.apps.metrics.model.MetricsResult;
import com.trading.apps.metrics.service.MetricsService;
import com.trading.apps.portfolio.model.PortfolioResult;

/**
 * REST controller for metrics endpoints.
 */
@RestController
@RequestMapping("/api/metrics")
@Validated
public class MetricsController {

    private final MetricsService metricsService;
    private final MetricsSimulationResponseMapper responseMapper;

    public MetricsController(
            MetricsService metricsService,
            MetricsSimulationResponseMapper responseMapper) {
        this.metricsService = metricsService;
        this.responseMapper = responseMapper;
    }

    @PostMapping("/calculate")
    public ResponseEntity<MetricsSimulationResponse> calculate(
            @RequestBody MetricsSimulationRequest request) {

        List<ExecutedTrade> trades = responseMapper.toExecutedTrades(request.getTrades());
        PortfolioResult portfolioResult = responseMapper.toPortfolioResult(
                request.getEquityCurve(),
                request.getStats(),
                request.getTrades());

        MetricsResult result = metricsService.calculate(trades, portfolioResult);
        MetricsSimulationResponse response = responseMapper.toResponse(result);

        return ResponseEntity.ok(response);
    }
}
