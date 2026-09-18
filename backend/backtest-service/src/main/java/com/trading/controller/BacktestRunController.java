package com.trading.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.trading.mapper.BacktestRunResponseMapper;
import com.trading.dto.request.RunBacktestRequest;
import com.trading.dto.response.BacktestRunDetailResponse;
import com.trading.dto.response.BacktestRunDetailResponse.EquityPointDetail;
import com.trading.dto.response.BacktestRunDetailResponse.MetricsDetail;
import com.trading.dto.response.BacktestRunDetailResponse.TradeDetail;
import com.trading.dto.response.BacktestRunSummaryResponse;
import com.trading.security.UserPrincipal;
import com.trading.model.BacktestRun;
import com.trading.service.BacktestPersistenceService;
import com.trading.service.impl.RunBacktestServiceImpl;

import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * REST controller for managing persisted backtest runs.
 */
@RestController
@RequestMapping("/api/backtest-runs")
@Validated
@RequiredArgsConstructor
public class BacktestRunController {

    private final com.trading.service.RunBacktestService runBacktestAppService;
    private final BacktestPersistenceService persistenceService;
    private final BacktestRunResponseMapper responseMapper;

    private Long getUserId(UserPrincipal principal) {
        return (principal != null && principal.getId() != null) ? principal.getId() : 1L;
    }

    /**
     * Runs a backtest and persists the result for the authenticated user.
     */
    @PostMapping
    public ResponseEntity<BacktestRunDetailResponse> runBacktest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RunBacktestRequest request) {

        Long userId = getUserId(principal);
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> params = request.strategyParams();
        if (params.containsKey("params") && params.get("params") instanceof java.util.Map<?, ?> inner) {
            params = (java.util.Map<String, Object>) inner;
        }

        BacktestRun run = runBacktestAppService.runAndSave(
                userId,
                request.symbol(),
                request.timeframe(),
                request.startTime(),
                request.getEndTimeOrNow(),
                request.strategyType(),
                params,
                request.getInitialCapitalOrDefault(),
                request.getCommissionRateOrDefault(),
                request.getSlippageRateOrDefault(),
                request.getPositionSizePercentOrDefault());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseMapper.toDetailResponse(run));
    }

    /**
     * Returns paginated list of backtest runs for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<BacktestRunSummaryResponse>> listBacktestRuns(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Long userId = getUserId(principal);
        List<BacktestRun> runs = persistenceService.findBacktestRuns(userId, page, size);
        return ResponseEntity.ok(responseMapper.toSummaryResponses(runs));
    }

    /**
     * Returns detailed view of a specific backtest run.
     */
    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public ResponseEntity<BacktestRunDetailResponse> getBacktestRun(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        Long userId = getUserId(principal);
        BacktestRun run = persistenceService.findBacktestRun(userId, id);
        return ResponseEntity.ok(responseMapper.toDetailResponse(run));
    }

    /**
     * Returns trades for a specific backtest run.
     */
    @Transactional(readOnly = true)
    @GetMapping("/{id}/trades")
    public ResponseEntity<List<TradeDetail>> getBacktestTrades(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        Long userId = getUserId(principal);
        BacktestRun run = persistenceService.findBacktestRun(userId, id);
        return ResponseEntity.ok(responseMapper.toTradeDetails(run));
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}/metrics")
    public ResponseEntity<MetricsDetail> getBacktestMetrics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        Long userId = getUserId(principal);
        BacktestRun run = persistenceService.findBacktestRunWithMetrics(userId, id);
        return ResponseEntity.ok(responseMapper.toMetricsDetail(run));
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}/equity")
    public ResponseEntity<List<EquityPointDetail>> getBacktestEquity(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        Long userId = getUserId(principal);
        BacktestRun run = persistenceService.findBacktestRunWithEquity(userId, id);
        return ResponseEntity.ok(responseMapper.toEquityPointDetails(run));
    }

    /**
     * Deletes a backtest run.
     */
    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBacktestRun(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        Long userId = getUserId(principal);
        persistenceService.deleteByIdAndUser(id, userId);
        return ResponseEntity.noContent().build();
    }
}
