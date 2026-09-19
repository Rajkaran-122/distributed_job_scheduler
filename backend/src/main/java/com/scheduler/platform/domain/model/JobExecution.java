package com.scheduler.platform.domain.model;

import com.scheduler.platform.domain.model.enums.ExecutionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * One row per execution ATTEMPT. Maps to the RANGE-partitioned job_executions table
 * (partitioned monthly by created_at, see V6 migration).
 *
 * Mapping note: the physical primary key is the composite (id, created_at) -- required
 * by Postgres for any partitioned table's primary key to include the partition key. We
 * still map @Id to `id` alone: it is a BIGINT GENERATED ALWAYS AS IDENTITY value that is
 * globally unique across every partition, so Hibernate's generated
 * "WHERE id = ?" UPDATE/DELETE clauses remain correct even though they don't reference
 * created_at. This avoids a clunky @IdClass with a mutable-timestamp key component.
 */
@Entity
@Table(name = "job_executions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "attempt_number", nullable = false)
    private int attemptNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    private Worker worker;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExecutionStatus status = ExecutionStatus.CLAIMED;

    @Column(name = "idempotency_key", nullable = false, length = 255)
    private String idempotencyKey;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "error_stacktrace", columnDefinition = "text")
    private String errorStacktrace;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> output;

    @Column(name = "correlation_id", length = 64)
    private String correlationId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, insertable = true)
    private Instant createdAt;

    public void markStarted(Instant now) {
        this.status = ExecutionStatus.RUNNING;
        this.startedAt = now;
    }

    public void markSucceeded(Instant now, Map<String, Object> output) {
        this.status = ExecutionStatus.SUCCEEDED;
        this.finishedAt = now;
        this.output = output;
        computeDuration();
    }

    public void markFailed(Instant now, String message, String stacktrace) {
        this.status = ExecutionStatus.FAILED;
        this.finishedAt = now;
        this.errorMessage = message;
        this.errorStacktrace = stacktrace;
        computeDuration();
    }

    private void computeDuration() {
        if (startedAt != null && finishedAt != null) {
            this.durationMs = (int) java.time.Duration.between(startedAt, finishedAt).toMillis();
        }
    }
}
