package com.trading.community.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trading.community.model.PostReaction;

@Repository
public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {

    Optional<PostReaction> findByPostIdAndUserId(Long postId, Long userId);

    List<PostReaction> findByPostId(Long postId);

    long countByPostIdAndReactionType(Long postId, String reactionType);

    void deleteByPostIdAndUserId(Long postId, Long userId);
}
