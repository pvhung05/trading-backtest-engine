package com.trading.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trading.mapper.BacktestTradingRecordResponseMapper;
import com.trading.dto.request.BacktestTradingRecordRequest;
import com.trading.dto.response.BacktestTradingRecordResponse;
import com.trading.model.BacktestCommand;
import com.trading.model.BacktestResult;
import com.trading.service.BacktestService;

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