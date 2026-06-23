package com.trading.apps.api.controller;

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

import com.trading.apps.api.mapper.BacktestRunResponseMapper;
import com.trading.apps.api.request.RunBacktestRequest;
import com.trading.apps.api.response.BacktestRunDetailResponse;
import com.trading.apps.api.response.BacktestRunDetailResponse.EquityPointDetail;
import com.trading.apps.api.response.BacktestRunDetailResponse.MetricsDetail;
import com.trading.apps.api.response.BacktestRunDetailResponse.TradeDetail;
import com.trading.apps.api.response.BacktestRunSummaryResponse;
import com.trading.apps.auth.security.UserPrincipal;
import com.trading.apps.persistence.entity.BacktestRun;
import com.trading.apps.persistence.service.BacktestPersistenceService;
import com.trading.apps.usecase.RunBacktestAppService;

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

    private final RunBacktestAppService runBacktestAppService;
    private final BacktestPersistenceService persistenceService;
    private final BacktestRunResponseMapper responseMapper;

    /**
     * Runs a backtest and persists the result for the authenticated user.
     */
    @PostMapping
    public ResponseEntity<BacktestRunDetailResponse> runBacktest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RunBacktestRequest request) {

        BacktestRun run = runBacktestAppService.runAndSave(
                principal.getId(),
                request.symbol(),
                request.timeframe(),
                request.startTime(),
                request.getEndTimeOrNow(),
                request.strategyType(),
                request.strategyParams().params(),
                request.initialCapital(),
                request.commissionRate(),
                request.slippageRate(),
                request.positionSizePercent());

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

        List<BacktestRun> runs = persistenceService.findBacktestRuns(principal.getId(), page, size);
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

        BacktestRun run = persistenceService.findBacktestRun(principal.getId(), id);
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

        BacktestRun run = persistenceService.findBacktestRun(principal.getId(), id);
        return ResponseEntity.ok(responseMapper.toTradeDetails(run));
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}/metrics")
    public ResponseEntity<MetricsDetail> getBacktestMetrics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        BacktestRun run = persistenceService.findBacktestRunWithMetrics(principal.getId(), id);
        return ResponseEntity.ok(responseMapper.toMetricsDetail(run));
    }

    @Transactional(readOnly = true)
    @GetMapping("/{id}/equity")
    public ResponseEntity<List<EquityPointDetail>> getBacktestEquity(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {

        BacktestRun run = persistenceService.findBacktestRunWithEquity(principal.getId(), id);
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

        persistenceService.deleteByIdAndUser(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
