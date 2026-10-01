package com.trading.community.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trading.community.model.IdeaLike;

@Repository
public interface IdeaLikeRepository extends JpaRepository<IdeaLike, Long> {

    Optional<IdeaLike> findByIdeaIdAndUserId(Long ideaId, Long userId);

    boolean existsByIdeaIdAndUserId(Long ideaId, Long userId);

    void deleteByIdeaIdAndUserId(Long ideaId, Long userId);

    long countByIdeaId(Long ideaId);
}
