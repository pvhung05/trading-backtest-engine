package com.trading.script.repository;

import com.trading.script.model.Script;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScriptRepository extends JpaRepository<Script, String> {
    Page<Script> findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    Optional<Script> findByIdAndUserId(String id, Long userId);
}
