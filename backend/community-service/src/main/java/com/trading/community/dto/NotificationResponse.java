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
public class NotificationResponse {

    private String id;
    private String type;
    private UserDto actor;
    private String message;
    private Long referenceId;
    private String referenceType;
    private Boolean isRead;
    private Instant createdAt;
}
