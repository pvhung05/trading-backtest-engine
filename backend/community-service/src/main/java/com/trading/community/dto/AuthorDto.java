package com.trading.community.dto;

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
public class AuthorDto {
    private String id;
    private String name;
    private String username;
    private String avatarUrl;
    private String badge;
    private Integer reputation;
    private Integer followersCount;
}
