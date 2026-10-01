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
public class FriendshipResponse {

    private String id;
    private UserDto user;
    private String status; // not_friend, pending_sent, pending_received, friends
    private Instant createdAt;
}
