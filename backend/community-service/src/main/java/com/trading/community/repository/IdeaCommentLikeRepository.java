package com.trading.community.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trading.community.model.IdeaCommentLike;

@Repository
public interface IdeaCommentLikeRepository extends JpaRepository<IdeaCommentLike, Long> {

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    void deleteByCommentIdAndUserId(Long commentId, Long userId);

    void deleteByCommentId(Long commentId);

    long countByCommentId(Long commentId);
}
