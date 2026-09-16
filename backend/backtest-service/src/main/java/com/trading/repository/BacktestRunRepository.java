package com.trading.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.trading.model.BacktestRun;
import com.trading.strategy.enums.StrategyType;

@Repository
public interface BacktestRunRepository extends JpaRepository<BacktestRun, Long> {

    @EntityGraph(attributePaths = {"trades"})
    Page<BacktestRun> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"trades"})
    Optional<BacktestRun> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT b FROM BacktestRun b LEFT JOIN FETCH b.metrics WHERE b.id = :id AND b.userId = :userId")
    @EntityGraph(attributePaths = {"metrics"})
    Optional<BacktestRun> findByIdAndUserIdWithMetrics(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT b FROM BacktestRun b LEFT JOIN FETCH b.equityPoints WHERE b.id = :id AND b.userId = :userId")
    @EntityGraph(attributePaths = {"equityPoints"})
    Optional<BacktestRun> findByIdAndUserIdWithEquity(@Param("id") Long id, @Param("userId") Long userId);

    long countByUserId(Long userId);

    Page<BacktestRun> findByUserIdAndStrategyTypeOrderByCreatedAtDesc(
            Long userId, StrategyType strategyType, Pageable pageable);

    void deleteByIdAndUserId(Long id, Long userId);
}
