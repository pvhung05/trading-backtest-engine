package com.trading.community.dto;

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
public class PostCommentResponse {

    private String id;
    private Long postId;
    private Long parentId;
    private UserDto author;
    private String content;
    private Integer likes;
    private Boolean hasLiked;
    private Integer replyCount;
    private List<PostCommentResponse> replies;
    private Instant createdAt;
}
