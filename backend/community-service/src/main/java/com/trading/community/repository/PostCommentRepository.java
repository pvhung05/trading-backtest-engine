package com.trading.community.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trading.community.model.PostComment;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    // Top-level comments
    List<PostComment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(Long postId);

    Page<PostComment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(Long postId, Pageable pageable);

    // Replies to a specific comment
    List<PostComment> findByParentIdOrderByCreatedAtAsc(Long parentId);

    long countByPostId(Long postId);

    long countByParentId(Long parentId);

    void deleteByParentId(Long parentId);
}
