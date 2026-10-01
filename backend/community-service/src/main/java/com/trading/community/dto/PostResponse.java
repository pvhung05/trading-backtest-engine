package com.trading.community.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

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
public class PostResponse {

    private String id;
    private UserDto author;
    private String content;
    private List<String> media;
    private String privacy;
    private Long groupId;
    private Map<String, Integer> reactions;
    private String userReaction;
    private Integer totalReactions;
    private Integer commentCount;
    private Integer shareCount;
    private Instant createdAt;
}
