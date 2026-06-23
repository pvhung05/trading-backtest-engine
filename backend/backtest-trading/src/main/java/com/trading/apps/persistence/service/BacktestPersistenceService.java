package com.trading.apps.persistence.service;

import java.util.List;

import com.trading.apps.persistence.entity.BacktestRun;

/**
 * Persistence service interface for storing and retrieving backtest run results.
 *
 * <p>This service accepts a fully-assembled {@link BacktestRun} entity (already populated with
 * its trades, metrics snapshot, and equity points by the mapper layer) and handles the
 * persistence concerns only.  The caller is responsible for constructing the entity.
 */
public interface BacktestPersistenceService {

    /**
     * Persists a complete backtest run and cascades to its children (trades, metrics, equity points).
     *
     * @param backtestRun the fully-populated BacktestRun entity
     * @return the persisted entity with generated identifiers
     */
    BacktestRun saveBacktestResult(BacktestRun backtestRun);

    /**
     * Returns paginated backtest runs owned by the given user, ordered by creation time descending.
     */
    List<BacktestRun> findBacktestRuns(Long userId, int page, int size);

    /**
     * Counts the total number of backtest runs for a given user.
     */
    long countBacktestRuns(Long userId);

    /**
     * Finds a backtest run by its id, scoped to a user for security.
     *
     * @throws com.trading.apps.api.exception.EntityNotFoundException if the run does not belong to the user
     */
    BacktestRun findBacktestRun(Long userId, Long runId);

    /**
     * Finds a backtest run by its id with metrics eagerly loaded.
     */
    BacktestRun findBacktestRunWithMetrics(Long userId, Long runId);

    /**
     * Finds a backtest run by its id with equity points eagerly loaded.
     */
    BacktestRun findBacktestRunWithEquity(Long userId, Long runId);

    /**
     * Deletes a backtest run by id, scoped to a user for security.
     *
     * @throws com.trading.apps.api.exception.EntityNotFoundException if the run does not belong to the user
     */
    void deleteByIdAndUser(Long runId, Long userId);
}
