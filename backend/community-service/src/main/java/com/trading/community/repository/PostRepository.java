package com.trading.community.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.trading.community.model.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByGroupIdOrderByCreatedAtDesc(Long groupId, Pageable pageable);

    Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // Feed visible for user: public posts OR posts by friends OR user's own posts
    @Query("SELECT p FROM Post p WHERE p.groupId IS NULL AND (" +
           "p.privacy = 'public' OR " +
           "p.userId = :userId OR " +
           "(p.privacy = 'friends' AND p.userId IN :friendIds)) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findFeedForUser(@Param("userId") Long userId, @Param("friendIds") List<Long> friendIds, Pageable pageable);

    // Feed only containing friends' posts (public or friends privacy)
    @Query("SELECT p FROM Post p WHERE p.groupId IS NULL AND p.userId IN :friendIds AND (" +
           "p.privacy = 'public' OR p.privacy = 'friends') " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findFriendsFeed(@Param("friendIds") List<Long> friendIds, Pageable pageable);

    // Public feed (when not logged in or general explore)
    @Query("SELECT p FROM Post p WHERE p.groupId IS NULL AND p.privacy = 'public' ORDER BY p.createdAt DESC")
    Page<Post> findPublicFeed(Pageable pageable);
}
