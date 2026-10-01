package com.trading.community.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trading.community.model.IdeaBoost;

@Repository
public interface IdeaBoostRepository extends JpaRepository<IdeaBoost, Long> {

    Optional<IdeaBoost> findByIdeaIdAndUserId(Long ideaId, Long userId);

    boolean existsByIdeaIdAndUserId(Long ideaId, Long userId);

    long countByIdeaId(Long ideaId);
}
