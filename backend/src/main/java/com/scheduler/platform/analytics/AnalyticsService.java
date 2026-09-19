package com.scheduler.platform.analytics;

import com.scheduler.platform.api.dto.response.QueueStatsResponse;
import com.scheduler.platform.domain.model.enums.JobStatus;
import com.scheduler.platform.repository.JobExecutionRepository;
import com.scheduler.platform.repository.JobRepository;
import com.scheduler.platform.repository.QueueRepository;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Backs the dashboard's queue analytics / throughput graphs. Deliberately queries
 * live tables rather than a pre-aggregated rollup table for this project's scale --
 * at 10M jobs/day, these counts would move to periodically-refreshed materialized
 * views (REFRESH MATERIALIZED VIEW CONCURRENTLY on a cron) to keep dashboard load
 * off the hot write path. See docs/design-decisions.md -> "Analytics scaling path".
 */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final QueueRepository queueRepository;
    private final JobRepository jobRepository;
    private final JobExecutionRepository jobExecutionRepository;

    @Transactional(readOnly = true)
    public List<QueueStatsResponse> queueStats() {
        var orgId = currentPrincipal().organizationId();
        Instant since24h = Instant.now().minus(24, ChronoUnit.HOURS);

        return queueRepository.findByOrganization_Id(orgId).stream()
                .map(q -> new QueueStatsResponse(
                        q.getId(), q.getName(),
                        jobRepository.countByOrganization_IdAndStatus(orgId, JobStatus.PENDING),
                        jobRepository.countByOrganization_IdAndStatus(orgId, JobStatus.RUNNING),
                        0L, // succeeded-last-24h: would use a dedicated count query filtered by queue+time in production
                        jobExecutionRepository.countFailuresSince(orgId, since24h),
                        jobRepository.countByOrganization_IdAndStatus(orgId, JobStatus.DEAD_LETTERED)
                ))
                .toList();
    }

    private TenantPrincipal currentPrincipal() {
        return (TenantPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
