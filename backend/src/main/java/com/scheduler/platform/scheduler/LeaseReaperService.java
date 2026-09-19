package com.scheduler.platform.scheduler;

import com.scheduler.platform.domain.model.Job;
import com.scheduler.platform.domain.model.JobExecution;
import com.scheduler.platform.domain.model.enums.ExecutionStatus;
import com.scheduler.platform.repository.JobExecutionRepository;
import com.scheduler.platform.repository.JobRepository;
import com.scheduler.platform.worker.JobCompletionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Reclaims jobs whose worker died mid-execution: the lease-based liveness mechanism
 * decided in the architecture phase. Runs only on the dispatcher leader (leadership
 * already implies "one active coordinator" for this cluster, so we piggyback on the same
 * election rather than running a second independent leader-election cycle for the reaper).
 *
 * Backed by the partial index idx_jobs_lease_expiry (WHERE status='RUNNING'), so this
 * scan's cost is proportional to the currently in-flight job count, not total job volume
 * -- this is what keeps the reaper cheap even with tens of millions of historical rows.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.scheduler.reaper", name = "enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class LeaseReaperService {

    private final JobRepository jobRepository;
    private final JobExecutionRepository jobExecutionRepository;
    private final JobCompletionService completionService;
    private final DispatcherLeaderElector leaderElector;

    /**
     * Entry point invoked by Spring's task scheduler. This call arrives from OUTSIDE the
     * bean (the scheduler holds a reference to the proxy), so @Transactional here is
     * actually honored by the AOP proxy -- unlike the previous version of this class,
     * which put @Transactional on processExpiredLeases() and called it via a plain
     * `this.processExpiredLeases()` from within this same method. That kind of
     * self-invocation never passes through the Spring proxy, so the transactional
     * advice is silently skipped and every repository call inside fails with
     * "TransactionRequiredException: no transaction in progress". Keeping the
     * @Transactional boundary on the externally-invoked method avoids that trap
     * entirely: by the time reclaimExpiredLeases()'s body runs, a transaction is
     * already bound to this thread, so processExpiredLeases() (called internally,
     * still on the same thread) sees it too.
     */
    @Scheduled(fixedDelayString = "${app.scheduler.reaper.scan-interval-ms}")
    @Transactional
    public void reclaimExpiredLeases() {
        if (!leaderElector.isLeader()) {
            return;
        }
        try {
            processExpiredLeases();
        } catch (Exception ex) {
            log.error("Reaper scan failed", ex);
        }
    }

    public void processExpiredLeases() {
        List<Job> expired = jobRepository.findJobsWithExpiredLeases(Instant.now());
        for (Job job : expired) {
            log.warn("Reclaiming job {} -- lease expired (worker likely crashed or was force-killed)", job.getId());

            Optional<JobExecution> execOpt = jobExecutionRepository.findTopByJob_IdOrderByAttemptNumberDesc(job.getId());
            JobExecution execution = execOpt.orElseGet(() -> JobExecution.builder()
                    .job(job)
                    .organization(job.getOrganization())
                    .attemptNumber(job.getAttemptCount())
                    .idempotencyKey(job.getId() + ":" + job.getAttemptCount() + ":reaper")
                    .startedAt(job.getUpdatedAt())
                    .build());
            execution.setStatus(ExecutionStatus.LEASE_EXPIRED);

            // recordFailure() applies the same retry-vs-dead-letter decision as any other
            // failure (it sets job status directly, so no separate "reclaim to PENDING"
            // step is needed first -- markRetrying/markDeadLettered both work from any
            // current status).
            completionService.recordFailure(job, execution,
                    new RuntimeException("Worker lease expired before job completion"));
        }
        if (!expired.isEmpty()) {
            log.info("Reaper reclaimed {} job(s) with expired leases", expired.size());
        }
    }
}
