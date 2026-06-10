package com.trading.apps.api.controller.backtest;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trading.apps.api.mapper.backtest.BacktestTradingRecordResponseMapper;
import com.trading.apps.api.request.backtest.BacktestTradingRecordRequest;
import com.trading.apps.api.response.backtest.BacktestTradingRecordResponse;
import com.trading.apps.backtest.model.BacktestCommand;
import com.trading.apps.backtest.model.BacktestResult;
import com.trading.apps.backtest.service.BacktestService;

/**
 * REST controller for backtest endpoints.
 */
@RestController
@RequestMapping("/api/backtest")
@Validated
public class BacktestController {

    private final BacktestService backtestService;
    private final BacktestTradingRecordResponseMapper responseMapper;

    public BacktestController(BacktestService backtestService,
            BacktestTradingRecordResponseMapper responseMapper) {
        this.backtestService = backtestService;
        this.responseMapper = responseMapper;
    }

    @PostMapping("/trading-records")
    public ResponseEntity<BacktestTradingRecordResponse> getTradingRecords(
            @RequestBody BacktestTradingRecordRequest request) {
        BacktestCommand command = request.toDomainCommand();
        BacktestResult result = backtestService.execute(command);
        return ResponseEntity.ok(responseMapper.toResponse(command, result));
    }
}