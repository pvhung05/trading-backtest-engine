package com.trading.community.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "community_post_comments", indexes = {
    @Index(name = "idx_post_comments_post_id", columnList = "postId"),
    @Index(name = "idx_post_comments_parent_id", columnList = "parentId"),
    @Index(name = "idx_post_comments_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long postId;

    private Long parentId; // nullable, for replies

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String authorName;

    @Column(nullable = false, length = 100)
    private String authorUsername;

    @Column(length = 500)
    private String authorAvatar;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    private Integer likesCount = 0;

    @Builder.Default
    private Integer replyCount = 0;

    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        if (this.likesCount == null) this.likesCount = 0;
        if (this.replyCount == null) this.replyCount = 0;
    }
}
