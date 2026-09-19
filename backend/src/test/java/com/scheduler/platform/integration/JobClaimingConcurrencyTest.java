package com.scheduler.platform.integration;

import com.scheduler.platform.domain.model.Job;
import com.scheduler.platform.domain.model.Organization;
import com.scheduler.platform.domain.model.Queue;
import com.scheduler.platform.domain.model.enums.JobStatus;
import com.scheduler.platform.domain.model.enums.JobType;
import com.scheduler.platform.repository.JobRepository;
import com.scheduler.platform.repository.OrganizationRepository;
import com.scheduler.platform.repository.QueueRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * THE most important test in this codebase: proves the `FOR UPDATE SKIP LOCKED` claim
 * query genuinely prevents two concurrent "dispatcher" threads from ever claiming the
 * same job, under real concurrent load against a real Postgres instance.
 *
 * Design of the test: 50 PENDING jobs are seeded, then 10 threads race to claim them
 * concurrently in small batches, each in its own transaction (simulating what the real
 * JobDispatchService does). If SKIP LOCKED were broken (or replaced with a naive
 * SELECT without locking), this test would fail intermittently by observing duplicate
 * job ids claimed across threads. Running it as a tight race with more threads than
 * available jobs-per-batch maximizes the chance of exposing a race condition if one
 * existed, rather than testing happy-path single-threaded behavior only.
 */
class JobClaimingConcurrencyTest extends AbstractIntegrationTest {

    @Autowired private JobRepository jobRepository;
    @Autowired private QueueRepository queueRepository;
    @Autowired private OrganizationRepository organizationRepository;
    @Autowired private PlatformTransactionManager transactionManager;

    private UUID queueId;

    @BeforeEach
    void seedJobs() {
        Organization org = organizationRepository.save(Organization.builder()
                .name("Concurrency Test Org").slug("concurrency-test-" + UUID.randomUUID()).build());
        Queue queue = queueRepository.save(Queue.builder()
                .organization(org).name("test-queue-" + UUID.randomUUID()).build());
        queueId = queue.getId();

        List<Job> jobs = IntStream.range(0, 50)
                .mapToObj(i -> Job.builder()
                        .organization(org).queue(queue)
                        .name("job-" + i).handlerType("noop").jobType(JobType.ONE_OFF)
                        .payload(Map.of())
                        .runAt(Instant.now().minusSeconds(10))
                        .nextRunAt(Instant.now().minusSeconds(10))
                        .status(JobStatus.PENDING)
                        .build())
                .collect(Collectors.toList());
        jobRepository.saveAll(jobs);
    }

    @Test
    void concurrentClaimAttempts_neverClaimTheSameJobTwice() throws Exception {
        int threadCount = 10;
        int batchSizePerThread = 10; // intentionally overlapping: 10 threads x 10 = 100 requested against only 50 available
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        List<Future<List<UUID>>> futures = new java.util.ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                startLatch.await(); // all threads fire as close to simultaneously as possible
                TransactionTemplate tx = new TransactionTemplate(transactionManager);
                return tx.execute(status -> jobRepository
                        .findClaimableJobs(new UUID[]{queueId}, Instant.now(), batchSizePerThread)
                        .stream().map(Job::getId).collect(Collectors.toList()));
            }));
        }

        startLatch.countDown();
        List<UUID> allClaimedIds = new java.util.ArrayList<>();
        for (Future<List<UUID>> f : futures) {
            allClaimedIds.addAll(f.get(30, TimeUnit.SECONDS));
        }
        executor.shutdown();

        Set<UUID> uniqueClaimedIds = Set.copyOf(allClaimedIds);

        // The core assertion: no job id appears more than once across ALL threads combined.
        assertThat(allClaimedIds).hasSameSizeAs(uniqueClaimedIds)
                .as("SKIP LOCKED must guarantee each job is claimed by exactly one transaction");

        // And every job that existed was eventually claimed by someone (no jobs lost).
        assertThat(uniqueClaimedIds).hasSize(50);
    }

    @Test
    void claimQuery_respectsPriorityOrdering() {
        // Reset queue with priority-varied jobs to verify ORDER BY priority ASC is honored.
        Job highPriority = jobRepository.findAll().stream()
                .filter(j -> j.getQueue().getId().equals(queueId)).findFirst().orElseThrow();
        highPriority.setPriority((short) 1);
        jobRepository.save(highPriority);

        List<Job> claimed = jobRepository.findClaimableJobs(new UUID[]{queueId}, Instant.now(), 1);
        assertThat(claimed).hasSize(1);
        assertThat(claimed.get(0).getId()).isEqualTo(highPriority.getId());
    }
}
