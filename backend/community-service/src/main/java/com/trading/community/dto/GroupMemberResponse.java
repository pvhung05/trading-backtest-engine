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
public class GroupMemberResponse {

    private String id;
    private Long groupId;
    private UserDto user;
    private String role; // ADMIN, MEMBER
    private String status; // APPROVED, PENDING, REJECTED
    private Instant joinedAt;
}
