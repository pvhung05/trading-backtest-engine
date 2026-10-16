package com.trading.script.repository;

import com.trading.script.model.ScriptBacktestJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScriptBacktestJobRepository extends JpaRepository<ScriptBacktestJob, String> {
    Page<ScriptBacktestJob> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<ScriptBacktestJob> findByIdAndUserId(String id, Long userId);
    Optional<ScriptBacktestJob> findByIdempotencyKey(String idempotencyKey);
}
