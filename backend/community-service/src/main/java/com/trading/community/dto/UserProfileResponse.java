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
public class UserProfileResponse {

    private String id;
    private String username;
    private String name;
    private String avatarUrl;
    private String bio;
    private String badge;
    private Integer reputation;
    private Integer followersCount;
    private Integer followingCount;
    private Integer ideasCount;
    private Boolean isOnline;

    // Interaction with viewing user
    private Boolean isFriend;
    private String friendStatus; // not_friend, pending_sent, pending_received, friends
    private Boolean isFollowing;

    private Instant createdAt;
}
