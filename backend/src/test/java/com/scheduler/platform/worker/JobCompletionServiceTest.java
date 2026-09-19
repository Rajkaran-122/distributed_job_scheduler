package com.scheduler.platform.worker;

import com.scheduler.platform.domain.model.*;
import com.scheduler.platform.domain.model.enums.BackoffStrategy;
import com.scheduler.platform.domain.model.enums.JobStatus;
import com.scheduler.platform.domain.model.enums.JobType;
import com.scheduler.platform.repository.DeadLetterJobRepository;
import com.scheduler.platform.repository.JobExecutionRepository;
import com.scheduler.platform.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Verifies JobCompletionService's core business rule: a failure with retries remaining
 * goes back to RETRYING with a future next_run_at, while a failure that exhausts
 * max_retries is dead-lettered exactly once (and never both).
 */
@ExtendWith(MockitoExtension.class)
class JobCompletionServiceTest {

    @Mock private JobRepository jobRepository;
    @Mock private JobExecutionRepository jobExecutionRepository;
    @Mock private DeadLetterJobRepository deadLetterJobRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    private JobCompletionService completionService;

    @BeforeEach
    void setUp() {
        completionService = new JobCompletionService(jobRepository, jobExecutionRepository, deadLetterJobRepository, eventPublisher);
    }

    private Job buildJob(int attemptCount, int maxRetries) {
        Organization org = Organization.builder().id(java.util.UUID.randomUUID()).name("Org").slug("org").build();
        Queue queue = Queue.builder().id(java.util.UUID.randomUUID()).organization(org).name("q").build();
        return Job.builder()
                .id(java.util.UUID.randomUUID())
                .organization(org).queue(queue)
                .name("test-job").handlerType("noop").jobType(JobType.ONE_OFF)
                .payload(Map.of())
                .status(JobStatus.RUNNING)
                .attemptCount(attemptCount)
                .maxRetries(maxRetries)
                .backoffStrategy(BackoffStrategy.FIXED)
                .baseDelaySeconds(1)
                .maxDelaySeconds(60)
                .build();
    }

    private JobExecution buildExecution(Job job) {
        return JobExecution.builder().job(job).organization(job.getOrganization())
                .attemptNumber(job.getAttemptCount()).idempotencyKey("k").build();
    }

    @Test
    void failureWithRetriesRemaining_transitionsToRetryingNotDeadLettered() {
        Job job = buildJob(2, 5); // 2 of 5 attempts used -- retries remain
        JobExecution execution = buildExecution(job);

        completionService.recordFailure(job, execution, new RuntimeException("transient error"));

        assertThat(job.getStatus()).isEqualTo(JobStatus.RETRYING);
        assertThat(job.getNextRunAt()).isNotNull().isAfter(java.time.Instant.now());
        verify(deadLetterJobRepository, never()).save(any());
        verify(jobRepository).save(job);
    }

    @Test
    void failureExhaustingRetries_isDeadLetteredExactlyOnce() {
        Job job = buildJob(5, 5); // already used all 5 retries
        JobExecution execution = buildExecution(job);

        completionService.recordFailure(job, execution, new RuntimeException("permanent error"));

        assertThat(job.getStatus()).isEqualTo(JobStatus.DEAD_LETTERED);
        ArgumentCaptor<DeadLetterJob> captor = ArgumentCaptor.forClass(DeadLetterJob.class);
        verify(deadLetterJobRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getFinalAttemptNumber()).isEqualTo(5);
        assertThat(captor.getValue().getLastErrorMessage()).contains("permanent error");
    }

    @Test
    void success_clearsLeaseAndLastError() {
        Job job = buildJob(1, 5);
        job.setLastError("previous failure");
        JobExecution execution = buildExecution(job);

        completionService.recordSuccess(job, execution, Map.of("result", "ok"));

        assertThat(job.getStatus()).isEqualTo(JobStatus.SUCCEEDED);
        assertThat(job.getLastError()).isNull();
        assertThat(job.getLockedBy()).isNull();
        assertThat(job.getLockedUntil()).isNull();
    }
}
