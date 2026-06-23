package com.trading.apps.persistence.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.trading.apps.auth.entity.AppUser;
import com.trading.apps.persistence.entity.BacktestRun;
import com.trading.apps.persistence.enums.BacktestStatus;
import com.trading.apps.strategy.enums.StrategyType;

@Repository
public interface BacktestRunRepository extends JpaRepository<BacktestRun, Long> {

    @EntityGraph(attributePaths = {"trades"})
    Page<BacktestRun> findByUserOrderByCreatedAtDesc(AppUser user, Pageable pageable);

    @EntityGraph(attributePaths = {"trades"})
    Optional<BacktestRun> findByIdAndUser(Long id, AppUser user);

    @Query("SELECT b FROM BacktestRun b LEFT JOIN FETCH b.metrics WHERE b.id = :id AND b.user = :user")
    @EntityGraph(attributePaths = {"metrics"})
    Optional<BacktestRun> findByIdAndUserWithMetrics(@Param("id") Long id, @Param("user") AppUser user);

    @Query("SELECT b FROM BacktestRun b LEFT JOIN FETCH b.equityPoints WHERE b.id = :id AND b.user = :user")
    @EntityGraph(attributePaths = {"equityPoints"})
    Optional<BacktestRun> findByIdAndUserWithEquity(@Param("id") Long id, @Param("user") AppUser user);

    long countByUser(AppUser user);

    Page<BacktestRun> findByUserAndStrategyTypeOrderByCreatedAtDesc(
            AppUser user, StrategyType strategyType, Pageable pageable);

    void deleteByIdAndUser(Long id, AppUser user);
}
