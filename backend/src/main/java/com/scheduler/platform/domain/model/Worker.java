package com.scheduler.platform.domain.model;

import com.scheduler.platform.domain.model.enums.WorkerStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Worker fleet registry -- observability only. Job ownership/correctness comes from the
 * lease columns on Job (lockedBy + lockedUntil), NOT from this table's heartbeat.
 * See docs/design-decisions.md -> "Worker heartbeat vs job lease".
 */
@Entity
@Table(name = "workers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(nullable = false)
    private String hostname;

    private Integer pid;

    @Column(length = 50)
    private String version;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WorkerStatus status = WorkerStatus.ACTIVE;

    @Builder.Default
    @Column(columnDefinition = "text[]")
    private List<String> queues = List.of();

    @Builder.Default
    @Column(name = "max_concurrency", nullable = false)
    private int maxConcurrency = 10;

    @Builder.Default
    @Column(name = "current_load", nullable = false)
    private int currentLoad = 0;

    @Builder.Default
    @Column(name = "last_heartbeat_at", nullable = false)
    private Instant lastHeartbeatAt = Instant.now();

    @CreationTimestamp
    @Column(name = "registered_at", updatable = false)
    private Instant registeredAt;

    @Column(name = "deregistered_at")
    private Instant deregisteredAt;
}
