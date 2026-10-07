package com.trading.community.model;

import java.math.BigDecimal;
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
@Table(name = "community_trading_ideas", indexes = {
    @Index(name = "idx_ideas_user_id", columnList = "userId"),
    @Index(name = "idx_ideas_symbol", columnList = "symbol"),
    @Index(name = "idx_ideas_asset_class", columnList = "assetClass"),
    @Index(name = "idx_ideas_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradingIdea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 30)
    private String symbol;

    @Column(nullable = false, length = 50)
    private String assetClass; // crypto, stocks, forex, indices, strategies

    @Column(nullable = false, length = 20)
    private String timeframe; // 4h, 1D, 1W, etc.

    @Column(nullable = false, length = 20)
    private String direction; // long, short, neutral

    @Column(precision = 19, scale = 8)
    private BigDecimal entryPrice;

    @Column(precision = 19, scale = 8)
    private BigDecimal targetPrice;

    @Column(precision = 19, scale = 8)
    private BigDecimal stopLossPrice;

    @Column(columnDefinition = "TEXT")
    private String coverImage;

    @Column(length = 20)
    private String videoDuration;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    private Long backtestRunId; // Optional link to backtest run (UC-11 & UML 2.5)

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

    @Builder.Default
    private Integer authorReputation = 0;

    @Builder.Default
    private Integer likesCount = 0;

    @Builder.Default
    private Integer commentsCount = 0;

    @Builder.Default
    private Integer boostsCount = 0;

    @Builder.Default
    private Integer viewsCount = 0;

    @Column(columnDefinition = "TEXT")
    private String tags; // JSON or comma-separated string e.g. "BTC,Breakout,Halving"

    @Builder.Default
    private Boolean isEditorsPick = false;

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.likesCount == null) this.likesCount = 0;
        if (this.commentsCount == null) this.commentsCount = 0;
        if (this.boostsCount == null) this.boostsCount = 0;
        if (this.viewsCount == null) this.viewsCount = 0;
        if (this.isEditorsPick == null) this.isEditorsPick = false;
        if (this.authorReputation == null) this.authorReputation = 0;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
