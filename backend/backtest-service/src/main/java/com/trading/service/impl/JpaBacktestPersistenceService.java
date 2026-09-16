package com.trading.service.impl;

import com.trading.service.*;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trading.model.BacktestRun;
import com.trading.repository.BacktestRunRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JpaBacktestPersistenceService implements BacktestPersistenceService {

    private final BacktestRunRepository backtestRunRepository;

    @Override
    @Transactional
    public BacktestRun saveBacktestResult(BacktestRun backtestRun) {
        return backtestRunRepository.save(backtestRun);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BacktestRun> findBacktestRuns(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return backtestRunRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public long countBacktestRuns(Long userId) {
        return backtestRunRepository.countByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public BacktestRun findBacktestRun(Long userId, Long runId) {
        return backtestRunRepository.findByIdAndUserId(runId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Backtest run not found: " + runId));
    }

    @Override
    @Transactional(readOnly = true)
    public BacktestRun findBacktestRunWithMetrics(Long userId, Long runId) {
        return backtestRunRepository.findByIdAndUserIdWithMetrics(runId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Backtest run not found: " + runId));
    }

    @Override
    @Transactional(readOnly = true)
    public BacktestRun findBacktestRunWithEquity(Long userId, Long runId) {
        return backtestRunRepository.findByIdAndUserIdWithEquity(runId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Backtest run not found: " + runId));
    }

    @Override
    @Transactional
    public void deleteByIdAndUser(Long runId, Long userId) {
        BacktestRun run = backtestRunRepository.findByIdAndUserId(runId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Backtest run not found: " + runId));
        backtestRunRepository.delete(run);
    }
}
