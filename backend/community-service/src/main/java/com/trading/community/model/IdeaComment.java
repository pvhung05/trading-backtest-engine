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
@Table(name = "community_idea_comments", indexes = {
    @Index(name = "idx_idea_comments_idea_id", columnList = "ideaId"),
    @Index(name = "idx_idea_comments_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdeaComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ideaId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String authorName;

    @Column(nullable = false, length = 100)
    private String authorUsername;

    @Column(length = 500)
    private String authorAvatar;

    @Column(length = 50)
    private String authorBadge;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    private Integer likesCount = 0;

    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        if (this.likesCount == null) this.likesCount = 0;
    }
}
