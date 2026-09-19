package com.scheduler.platform.worker;

import com.scheduler.platform.domain.model.DeadLetterJob;
import com.scheduler.platform.domain.model.Job;
import com.scheduler.platform.domain.model.JobExecution;
import com.scheduler.platform.domain.policy.RetryPolicyCalculator;
import com.scheduler.platform.repository.DeadLetterJobRepository;
import com.scheduler.platform.repository.JobExecutionRepository;
import com.scheduler.platform.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

/**
 * Applies the outcome of a job execution: success, retry (with backoff), or dead-letter.
 * This is the single place the retry engine and DLQ routing live -- see
 * RetryPolicyCalculator for the backoff math itself.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobCompletionService {

    private final JobRepository jobRepository;
    private final JobExecutionRepository jobExecutionRepository;
    private final DeadLetterJobRepository deadLetterJobRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void recordSuccess(Job job, JobExecution execution, Map<String, Object> output) {
        Instant now = Instant.now();
        execution.markSucceeded(now, output);
        jobExecutionRepository.save(execution);

        job.markSucceeded();
        jobRepository.save(job);

        eventPublisher.publishEvent(new JobLifecycleEvent(job.getId(), job.getOrganization().getId(), "job.succeeded"));
    }

    @Transactional
    public void recordFailure(Job job, JobExecution execution, Throwable error) {
        Instant now = Instant.now();
        String message = error.getMessage() != null ? error.getMessage() : error.getClass().getSimpleName();
        String stacktrace = stackTraceToString(error);

        execution.markFailed(now, message, stacktrace);
        jobExecutionRepository.save(execution);

        if (job.hasRetriesRemaining()) {
            Instant nextAttempt = RetryPolicyCalculator.computeNextAttempt(
                    job.getBackoffStrategy(), job.getAttemptCount(),
                    job.getBaseDelaySeconds(), job.getMaxDelaySeconds(), now);
            job.markRetrying(message, nextAttempt);
            jobRepository.save(job);
            log.info("Job {} failed (attempt {}/{}), retrying at {}", job.getId(), job.getAttemptCount(), job.getMaxRetries(), nextAttempt);
            eventPublisher.publishEvent(new JobLifecycleEvent(job.getId(), job.getOrganization().getId(), "job.retrying"));
        } else {
            job.markDeadLettered(message);
            jobRepository.save(job);

            DeadLetterJob dlq = DeadLetterJob.builder()
                    .job(job)
                    .organization(job.getOrganization())
                    .queue(job.getQueue())
                    .finalAttemptNumber(job.getAttemptCount())
                    .payloadSnapshot(job.getPayload())
                    .lastErrorMessage(message)
                    .lastErrorStacktrace(stacktrace)
                    .build();
            deadLetterJobRepository.save(dlq);

            log.warn("Job {} exhausted {} retries, dead-lettered", job.getId(), job.getMaxRetries());
            eventPublisher.publishEvent(new JobLifecycleEvent(job.getId(), job.getOrganization().getId(), "job.dead_lettered"));
        }
    }

    private String stackTraceToString(Throwable t) {
        java.io.StringWriter sw = new java.io.StringWriter();
        t.printStackTrace(new java.io.PrintWriter(sw));
        String full = sw.toString();
        // Cap stored stacktrace length -- unbounded stacktraces (e.g. from recursive
        // failures) shouldn't be allowed to bloat a high-write-volume partitioned table.
        return full.length() > 8000 ? full.substring(0, 8000) : full;
    }
}
