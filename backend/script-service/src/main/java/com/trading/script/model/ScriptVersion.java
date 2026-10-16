package com.trading.script.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "script_versions", uniqueConstraints = {
    @UniqueConstraint(name = "uk_script_version", columnNames = {"script_id", "version_number"})
}, indexes = {
    @Index(name = "idx_version_hash", columnList = "source_hash")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptVersion {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_id", nullable = false)
    private Script script;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "source_code", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String sourceCode;

    @Column(name = "compiled_ir", nullable = false, columnDefinition = "JSON")
    private String compiledIr;

    @Column(name = "source_hash", nullable = false, length = 64)
    private String sourceHash;

    @Column(name = "ast_complexity_score", nullable = false)
    private int astComplexityScore;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onPrePersist() {
        if (id == null) {
            id = java.util.UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
