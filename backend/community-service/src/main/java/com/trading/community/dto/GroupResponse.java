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
public class GroupResponse {

    private String id;
    private String name;
    private String description;
    private String coverUrl;
    private String privacy;
    private Integer memberCount;
    private Boolean isMember;
    private Boolean isPendingApproval;
    private String role;
    private Instant createdAt;
}
