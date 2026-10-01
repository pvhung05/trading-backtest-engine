package com.trading.community.model;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "community_posts", indexes = {
    @Index(name = "idx_posts_user_id", columnList = "userId"),
    @Index(name = "idx_posts_group_id", columnList = "groupId"),
    @Index(name = "idx_posts_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @Column(columnDefinition = "TEXT")
    private String media; // JSON array string or comma separated URLs (e.g. ["url1", "url2"])

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String privacy = "public"; // public, friends, only_me

    private Long groupId; // nullable, if posted to a group

    @Builder.Default
    private Integer likesCount = 0;

    @Builder.Default
    private Integer loveCount = 0;

    @Builder.Default
    private Integer hahaCount = 0;

    @Builder.Default
    private Integer wowCount = 0;

    @Builder.Default
    private Integer sadCount = 0;

    @Builder.Default
    private Integer angryCount = 0;

    @Builder.Default
    private Integer commentCount = 0;

    @Builder.Default
    private Integer shareCount = 0;

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.likesCount == null) this.likesCount = 0;
        if (this.loveCount == null) this.loveCount = 0;
        if (this.hahaCount == null) this.hahaCount = 0;
        if (this.wowCount == null) this.wowCount = 0;
        if (this.sadCount == null) this.sadCount = 0;
        if (this.angryCount == null) this.angryCount = 0;
        if (this.commentCount == null) this.commentCount = 0;
        if (this.shareCount == null) this.shareCount = 0;
        if (this.privacy == null) this.privacy = "public";
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
