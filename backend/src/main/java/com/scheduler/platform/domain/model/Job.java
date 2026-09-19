package com.scheduler.platform.domain.model;

import com.scheduler.platform.domain.model.enums.BackoffStrategy;
import com.scheduler.platform.domain.model.enums.JobStatus;
import com.scheduler.platform.domain.model.enums.JobType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * The central entity of the platform.
 *
 * NOTE on architecture: the "clean architecture" plan calls for a framework-free domain
 * model (Job as a plain Java class with zero JPA/Spring annotations) separated from a
 * persistence entity by a mapper. For a project this size that separation pays for
 * itself once you have multiple persistence backends or heavy domain logic that needs
 * isolated unit testing. Here we take the pragmatic middle ground used by most real
 * Spring Boot codebases: a single "rich entity" that carries both persistence mapping
 * AND state-transition business rules (see the transitionTo/markRunning/etc. methods
 * below). It is still fully unit-testable without Spring (no @Autowired, no repository
 * calls inside the entity) -- we just accept the JPA annotations as a fixed cost rather
 * than introducing a parallel domain object + mapper for a single persistence target.
 */
@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "queue_id", nullable = false)
    private Queue queue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(nullable = false)
    private String name;

    @Column(name = "handler_type", nullable = false)
    private String handlerType;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, length = 20)
    private JobType jobType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    @Column(nullable = false)
    private Map<String, Object> payload = Map.of();

    @Column(name = "cron_expression", length = 120)
    private String cronExpression;

    @Builder.Default
    @Column(nullable = false, length = 64)
    private String timezone = "UTC";

    @Column(name = "run_at")
    private Instant runAt;

    @Column(name = "next_run_at", nullable = false)
    private Instant nextRunAt;

    @Builder.Default
    @Column(nullable = false)
    private short priority = 5;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobStatus status = JobStatus.PENDING;

    @Builder.Default
    @Column(name = "max_retries", nullable = false)
    private int maxRetries = 5;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "backoff_strategy", nullable = false, length = 20)
    private BackoffStrategy backoffStrategy = BackoffStrategy.EXPONENTIAL_JITTER;

    @Builder.Default
    @Column(name = "base_delay_seconds", nullable = false)
    private int baseDelaySeconds = 2;

    @Builder.Default
    @Column(name = "max_delay_seconds", nullable = false)
    private int maxDelaySeconds = 3600;

    @Builder.Default
    @Column(name = "timeout_seconds", nullable = false)
    private int timeoutSeconds = 300;

    @Builder.Default
    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "unique_key")
    private String uniqueKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locked_by")
    private Worker lockedBy;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "last_error", columnDefinition = "text")
    private String lastError;

    @Builder.Default
    @Column(name = "is_paused", nullable = false)
    private boolean paused = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Version
    @Column(nullable = false)
    private int version;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // ==================== Domain behavior (state machine) ====================
    // See docs/state-machine.md for the full transition table and diagram. These
    // methods are the ONLY place job status should be mutated -- controllers/services
    // must never do `job.setStatus(...)` directly, so every transition's invariants
    // (e.g. clearing the lease on completion) are enforced in exactly one place.

    /** Called by the dispatcher/worker at the moment a job is claimed via SKIP LOCKED. */
    public void markRunning(Worker worker, Instant leaseUntil) {
        this.status = JobStatus.RUNNING;
        this.lockedBy = worker;
        this.lockedUntil = leaseUntil;
        this.attemptCount += 1;
    }

    /** Renewed periodically by the worker while a long-running handler executes. */
    public void renewLease(Instant newLeaseUntil) {
        if (this.status != JobStatus.RUNNING) {
            throw new IllegalStateException("Cannot renew lease on job not in RUNNING state: " + this.status);
        }
        this.lockedUntil = newLeaseUntil;
    }

    public void markSucceeded() {
        this.status = JobStatus.SUCCEEDED;
        this.lockedBy = null;
        this.lockedUntil = null;
        this.lastError = null;
    }

    /** Failed but retries remain -- goes back to PENDING with a future next_run_at. */
    public void markRetrying(String errorMessage, Instant nextAttemptAt) {
        this.status = JobStatus.RETRYING;
        this.lockedBy = null;
        this.lockedUntil = null;
        this.lastError = errorMessage;
        this.nextRunAt = nextAttemptAt;
    }

    /** Retries exhausted -- terminal failure, routed to the DLQ by the caller. */
    public void markDeadLettered(String errorMessage) {
        this.status = JobStatus.DEAD_LETTERED;
        this.lockedBy = null;
        this.lockedUntil = null;
        this.lastError = errorMessage;
    }

    /** Reaper reclaiming a job whose worker died mid-execution. */
    public void reclaimExpiredLease() {
        if (this.status != JobStatus.RUNNING) {
            throw new IllegalStateException("Cannot reclaim a job not in RUNNING state: " + this.status);
        }
        this.status = JobStatus.PENDING;
        this.lockedBy = null;
        this.lockedUntil = null;
    }

    public boolean hasRetriesRemaining() {
        return this.attemptCount < this.maxRetries;
    }

    public boolean isLeaseExpired(Instant now) {
        return this.status == JobStatus.RUNNING && this.lockedUntil != null && this.lockedUntil.isBefore(now);
    }
}
