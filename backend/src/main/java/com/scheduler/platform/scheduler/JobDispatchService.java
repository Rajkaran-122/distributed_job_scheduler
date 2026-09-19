package com.scheduler.platform.scheduler;

import com.scheduler.platform.domain.model.Job;
import com.scheduler.platform.domain.model.enums.JobStatus;
import com.scheduler.platform.infrastructure.redis.RedisQueuePublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.scheduler.platform.repository.JobRepository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Claims due jobs (SKIP LOCKED, see JobRepository.findClaimableJobs) and hands them off
 * to the Redis-backed ready queue for workers to consume.
 *
 * Correctness-critical detail: the job's status is flipped PENDING -> SCHEDULED inside
 * the SAME database transaction as the claim. The Redis push, however, only happens
 * AFTER that transaction commits (via TransactionSynchronization#afterCommit). If we
 * pushed to Redis first and the DB transaction then rolled back (e.g. due to a
 * constraint violation on a concurrently-edited job), a worker could pull a job id from
 * Redis that Postgres still thinks is PENDING and never transitioned -- a phantom
 * dispatch. Publishing only after commit guarantees Redis and Postgres never disagree
 * about which jobs have been handed off.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobDispatchService {

    private final JobRepository jobRepository;
    private final RedisQueuePublisher queuePublisher;

    @Transactional
    public int claimAndDispatch(UUID[] activeQueueIds, int batchSize) {
        if (activeQueueIds.length == 0) {
            return 0;
        }
        List<Job> claimed = jobRepository.findClaimableJobs(activeQueueIds, Instant.now(), batchSize);

        for (Job job : claimed) {
            job.setStatus(JobStatus.SCHEDULED);
            jobRepository.save(job);

            // Defer the Redis push until the surrounding transaction actually commits.
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    queuePublisher.publish(job);
                }
            });
        }

        if (!claimed.isEmpty()) {
            log.info("Dispatched {} job(s) to ready queues", claimed.size());
        }
        return claimed.size();
    }
}
