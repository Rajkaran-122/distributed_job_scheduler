package com.scheduler.platform.worker;

import com.scheduler.platform.domain.model.Job;
import com.scheduler.platform.domain.model.JobExecution;
import com.scheduler.platform.domain.model.Worker;
import com.scheduler.platform.domain.model.enums.ExecutionStatus;
import com.scheduler.platform.domain.model.enums.JobStatus;
import com.scheduler.platform.repository.JobExecutionRepository;
import com.scheduler.platform.repository.JobRepository;
import com.scheduler.platform.repository.WorkerRepository;
import com.scheduler.platform.scheduler.SchedulerProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Transitions a job from SCHEDULED to RUNNING and creates its execution-ledger row, all
 * in one transaction. This is where the idempotency guarantee is actually enforced: the
 * unique index uq_job_executions_idempotency (job_id, idempotency_key, created_at) means
 * that if two threads/processes somehow both try to start attempt N of the same job
 * (which SKIP LOCKED should already prevent at the dispatch stage, but this is
 * belt-and-suspenders against any Redis-layer double-delivery), the second insert fails
 * with a constraint violation and that caller backs off instead of double-executing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobExecutionService {

    private final JobRepository jobRepository;
    private final JobExecutionRepository jobExecutionRepository;
    private final WorkerRepository workerRepository;
    private final SchedulerProperties properties;

    public record StartedExecution(Job job, JobExecution execution) {}

    @Transactional
    public Optional<StartedExecution> tryStartExecution(UUID jobId, UUID workerId) {
        Optional<Job> jobOpt = jobRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            log.warn("Job {} not found when attempting to start execution (may have been deleted)", jobId);
            return Optional.empty();
        }
        Job job = jobOpt.get();

        // Guard against a job that was already picked up by another consumer, cancelled,
        // or paused between being pushed to Redis and this worker popping it.
        if (job.getStatus() != JobStatus.SCHEDULED) {
            log.info("Skipping job {} - expected SCHEDULED but was {}", jobId, job.getStatus());
            return Optional.empty();
        }

        Worker worker = workerRepository.findById(workerId).orElseThrow();
        Instant now = Instant.now();
        Instant leaseUntil = now.plusSeconds(properties.worker().leaseDurationSeconds());

        job.markRunning(worker, leaseUntil);
        jobRepository.save(job);

        String idempotencyKey = job.getId() + ":" + job.getAttemptCount();
        JobExecution execution = JobExecution.builder()
                .job(job)
                .organization(job.getOrganization())
                .attemptNumber(job.getAttemptCount())
                .worker(worker)
                .status(ExecutionStatus.RUNNING)
                .idempotencyKey(idempotencyKey)
                .startedAt(now)
                .correlationId(org.slf4j.MDC.get("correlationId"))
                .build();

        try {
            execution = jobExecutionRepository.save(execution);
        } catch (DataIntegrityViolationException dup) {
            // Another process already recorded this exact attempt -- back off rather than
            // executing twice. This should be rare (SKIP LOCKED + SCHEDULED-status guard
            // above already prevent it in the normal case) but is the final safety net.
            log.warn("Duplicate execution attempt detected for job {} attempt {} -- skipping", jobId, job.getAttemptCount());
            return Optional.empty();
        }

        return Optional.of(new StartedExecution(job, execution));
    }

    @Transactional
    public void renewLease(UUID jobId) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.renewLease(Instant.now().plusSeconds(properties.worker().leaseDurationSeconds()));
            jobRepository.save(job);
        });
    }
}
