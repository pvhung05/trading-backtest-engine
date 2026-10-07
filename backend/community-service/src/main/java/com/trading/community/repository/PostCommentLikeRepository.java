package com.trading.community.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trading.community.model.PostCommentLike;

@Repository
public interface PostCommentLikeRepository extends JpaRepository<PostCommentLike, Long> {

    Optional<PostCommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    void deleteByCommentIdAndUserId(Long commentId, Long userId);

    void deleteByCommentId(Long commentId);

    long countByCommentId(Long commentId);
}
