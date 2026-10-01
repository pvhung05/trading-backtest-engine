package com.trading.community.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trading.community.model.IdeaBookmark;

@Repository
public interface IdeaBookmarkRepository extends JpaRepository<IdeaBookmark, Long> {

    Optional<IdeaBookmark> findByIdeaIdAndUserId(Long ideaId, Long userId);

    boolean existsByIdeaIdAndUserId(Long ideaId, Long userId);

    void deleteByIdeaIdAndUserId(Long ideaId, Long userId);

    Page<IdeaBookmark> findByUserId(Long userId, Pageable pageable);

    List<IdeaBookmark> findByUserId(Long userId);
}
