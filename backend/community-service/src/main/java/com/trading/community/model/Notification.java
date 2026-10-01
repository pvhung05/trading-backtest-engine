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
@Table(name = "community_notifications", indexes = {
    @Index(name = "idx_notifications_recipient", columnList = "recipientId"),
    @Index(name = "idx_notifications_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long recipientId; // User who receives notification

    @Column(nullable = false)
    private Long actorId; // User who triggered notification

    @Column(nullable = false, length = 100)
    private String actorName;

    @Column(length = 500)
    private String actorAvatar;

    @Column(nullable = false, length = 50)
    private String type; // FRIEND_REQUEST, FRIEND_ACCEPT, IDEA_LIKE, IDEA_COMMENT, POST_REACT, POST_COMMENT, NEW_FOLLOWER, SYSTEM

    private Long referenceId; // ideaId or postId or friendRequestId

    @Column(length = 50)
    private String referenceType; // IDEA, POST, USER, GROUP

    @Column(nullable = false, length = 500)
    private String message;

    @Builder.Default
    private Boolean isRead = false;

    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        if (this.isRead == null) this.isRead = false;
    }
}
