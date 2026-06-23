package com.trading.apps.persistence.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trading.apps.auth.repository.UserRepository;
import com.trading.apps.persistence.entity.BacktestRun;
import com.trading.apps.persistence.repository.BacktestRunRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JpaBacktestPersistenceService implements BacktestPersistenceService {

    private final BacktestRunRepository backtestRunRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public BacktestRun saveBacktestResult(BacktestRun backtestRun) {
        return backtestRunRepository.save(backtestRun);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BacktestRun> findBacktestRuns(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return backtestRunRepository.findByUserOrderByCreatedAtDesc(
                userRepository.getReferenceById(userId), pageable).getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public long countBacktestRuns(Long userId) {
        return backtestRunRepository.countByUser(userRepository.getReferenceById(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public BacktestRun findBacktestRun(Long userId, Long runId) {
        return backtestRunRepository.findByIdAndUser(runId, userRepository.getReferenceById(userId))
                .orElseThrow(() -> new IllegalArgumentException("Backtest run not found: " + runId));
    }

    @Override
    @Transactional(readOnly = true)
    public BacktestRun findBacktestRunWithMetrics(Long userId, Long runId) {
        return backtestRunRepository.findByIdAndUserWithMetrics(runId, userRepository.getReferenceById(userId))
                .orElseThrow(() -> new IllegalArgumentException("Backtest run not found: " + runId));
    }

    @Override
    @Transactional(readOnly = true)
    public BacktestRun findBacktestRunWithEquity(Long userId, Long runId) {
        return backtestRunRepository.findByIdAndUserWithEquity(runId, userRepository.getReferenceById(userId))
                .orElseThrow(() -> new IllegalArgumentException("Backtest run not found: " + runId));
    }

    @Override
    @Transactional
    public void deleteByIdAndUser(Long runId, Long userId) {
        BacktestRun run = backtestRunRepository.findByIdAndUser(runId, userRepository.getReferenceById(userId))
                .orElseThrow(() -> new IllegalArgumentException("Backtest run not found: " + runId));
        backtestRunRepository.delete(run);
    }
}
