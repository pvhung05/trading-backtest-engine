package com.trading.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.trading.mapper.ExecutionSimulationResponseMapper;
import com.trading.dto.request.ExecutionSimulationRequest;
import com.trading.dto.request.PortfolioSimulationRequest;
import com.trading.dto.response.ExecutionSimulationResponse;
import com.trading.dto.response.FullSimulationResponse;
import com.trading.model.ExecutedTrade;
import com.trading.model.ExecutionSimulationCommand;
import com.trading.service.ExecutionSimulationService;

/**
 * REST controller for execution endpoints.
 */
@RestController
@RequestMapping("/api/execution")
@Validated
public class ExecutionController {

    private final ExecutionSimulationService executionSimulationService;
    private final ExecutionSimulationResponseMapper responseMapper;

    public ExecutionController(ExecutionSimulationService executionSimulationService,
            ExecutionSimulationResponseMapper responseMapper) {
        this.executionSimulationService = executionSimulationService;
        this.responseMapper = responseMapper;
    }

    @PostMapping("/executed-trades")
    public ResponseEntity<ExecutionSimulationResponse> getExecutedTrades(@RequestBody ExecutionSimulationRequest request) {
        ExecutionSimulationCommand command = request.toDomainCommand();
        // Require portfolio capital to be initialized (positive) before executing
        if (command.getCapital() <= 0.0d) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Portfolio initial capital is not initialized. Create a portfolio with initial capital before executing.");
        }

        List<ExecutedTrade> executedTrades = executionSimulationService.execute(command);
        return ResponseEntity.ok(responseMapper.toResponse(command, executedTrades));
    }

    @PostMapping("/simulation/full")
    public ResponseEntity<FullSimulationResponse> fullSimulation(@RequestBody PortfolioSimulationRequest request) {
        if (request.getCapital() == null || request.getCapital() <= 0.0d) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Capital must be greater than 0");
        }
        FullSimulationResponse response = executionSimulationService.fullSimulation(request);
        return ResponseEntity.ok(response);
    }
}