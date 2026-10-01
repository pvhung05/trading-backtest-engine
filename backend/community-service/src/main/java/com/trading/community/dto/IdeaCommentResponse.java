package com.trading.community.dto;

import java.time.Instant;

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
public class IdeaCommentResponse {
    private String id;
    private Long ideaId;
    private AuthorDto author;
    private String content;
    private Integer likes;
    private Instant createdAt;
}
