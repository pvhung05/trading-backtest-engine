package com.trading.community.dto;

import java.util.List;

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
public class CreatePostRequest {

    @NotBlank(message = "Post content cannot be empty")
    private String content;

    private List<String> media;

    @Builder.Default
    private String privacy = "public"; // public, friends, only_me

    private Long groupId;
}
