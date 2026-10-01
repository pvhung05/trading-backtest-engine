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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "community_group_members", uniqueConstraints = {
    @UniqueConstraint(name = "uk_group_user_member", columnNames = {"groupId", "userId"})
}, indexes = {
    @Index(name = "idx_group_members_group", columnList = "groupId"),
    @Index(name = "idx_group_members_user", columnList = "userId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long groupId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "MEMBER"; // ADMIN, MEMBER

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "APPROVED"; // APPROVED, PENDING

    private Instant joinedAt;

    @PrePersist
    void onCreate() {
        this.joinedAt = Instant.now();
        if (this.role == null) this.role = "MEMBER";
        if (this.status == null) this.status = "APPROVED";
    }
}
