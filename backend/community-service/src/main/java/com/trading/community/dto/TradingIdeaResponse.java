package com.trading.community.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradingIdeaResponse {
    private String id;
    private String title;
    private String symbol;
    private String assetClass;
    private String timeframe;
    private String direction;
    private BigDecimal entryPrice;
    private BigDecimal targetPrice;
    private BigDecimal stopLossPrice;
    private String coverImage;
    private String videoDuration;
    private String summary;
    private String content;
    private AuthorDto author;
    private Integer likes;
    private Integer comments;
    private Integer boosts;
    private Integer views;
    private List<String> tags;
    private Boolean isEditorsPick;
    private Instant createdAt;

    // Current user interaction flags
    private Boolean hasLiked;
    private Boolean hasBoosted;
    private Boolean hasBookmarked;
    private Boolean isFollowingAuthor;
}
