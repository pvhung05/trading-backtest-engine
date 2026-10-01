package com.trading.community.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trading.community.dto.ApiResponse;

@RestController
@RequestMapping("/api/community")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        return ResponseEntity.ok(ApiResponse.ok("Community service is healthy", Map.of(
                "service", "community-service",
                "status", "UP",
                "timestamp", System.currentTimeMillis()
        )));
    }
}
