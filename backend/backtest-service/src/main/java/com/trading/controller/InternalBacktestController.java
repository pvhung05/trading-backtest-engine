package com.trading.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trading.dto.request.DynamicRunRequest;
import com.trading.dto.response.BacktestRunDetailResponse;
import com.trading.mapper.BacktestRunResponseMapper;
import com.trading.model.BacktestRun;
import com.trading.service.RunBacktestService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Internal REST controller for executing dynamic DSL strategy backtests
 * called by script-service or internal workers.
 */
@RestController
@RequestMapping("/api/internal/v1/backtest")
@Validated
@RequiredArgsConstructor
public class InternalBacktestController {

    private final RunBacktestService runBacktestService;
    private final BacktestRunResponseMapper responseMapper;

    @PostMapping("/dynamic-run")
    public ResponseEntity<BacktestRunDetailResponse> runDynamicBacktest(
            @Valid @RequestBody DynamicRunRequest request) {

        Map<String, Object> params = new HashMap<>();
        params.put("entryRule", request.entryRule());
        params.put("exitRule", request.exitRule());
        params.put("warmupBars", request.warmupBars());

        BacktestRun run = runBacktestService.runAndSave(
                request.getUserIdOrDefault(),
                request.symbol(),
                request.timeframe(),
                request.startTime(),
                request.getEndTimeOrNow(),
                "DYNAMIC_DSL",
                params,
                request.getInitialCapitalOrDefault(),
                request.getCommissionRateOrDefault(),
                request.getSlippageRateOrDefault(),
                request.getPositionSizePercentOrDefault());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseMapper.toDetailResponse(run));
    }
}
