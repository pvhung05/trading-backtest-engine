package com.trading.community.dto;

import jakarta.validation.constraints.NotBlank;
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
public class PostCommentRequest {

    @NotBlank(message = "Comment content cannot be empty")
    private String content;

    private Long parentId; // optional, for replies
}
