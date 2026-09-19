package com.scheduler.platform.domain.model;

import com.scheduler.platform.domain.model.enums.QueueState;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "queues", uniqueConstraints = @UniqueConstraint(columnNames = {"organization_id", "name"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Queue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QueueState state = QueueState.ACTIVE;

    @Builder.Default
    @Column(name = "max_concurrency", nullable = false)
    private int maxConcurrency = 10;

    @Column(name = "rate_limit_per_minute")
    private Integer rateLimitPerMinute;

    @Builder.Default
    @Column(name = "default_priority", nullable = false)
    private short defaultPriority = 5;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public boolean isPaused() {
        return state == QueueState.PAUSED;
    }
}
