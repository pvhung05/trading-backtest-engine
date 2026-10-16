package com.trading.script.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "script_backtest_jobs", indexes = {
    @Index(name = "idx_jobs_user_status", columnList = "user_id, status"),
    @Index(name = "idx_jobs_idempotency", columnList = "idempotency_key")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptBacktestJob {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "script_id", length = 36)
    private String scriptId;

    @Column(name = "script_version_id", length = 36)
    private String scriptVersionId;

    @Column(nullable = false, length = 20)
    private String symbol;

    @Column(nullable = false, length = 10)
    private String timeframe;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(name = "initial_capital", nullable = false)
    private double initialCapital;

    @Column(name = "commission_rate", nullable = false)
    private double commissionRate;

    @Column(name = "slippage_rate", nullable = false)
    private double slippageRate;

    @Column(name = "position_size_percent", nullable = false)
    private double positionSizePercent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private JobStatus status = JobStatus.QUEUED;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "idempotency_key", length = 64, unique = true)
    private String idempotencyKey;

    @Column(name = "backtest_run_id")
    private Long backtestRunId;

    @Column(name = "result_payload", columnDefinition = "LONGTEXT")
    private String resultPayload;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void onPrePersist() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        updatedAt = Instant.now();
    }
}
