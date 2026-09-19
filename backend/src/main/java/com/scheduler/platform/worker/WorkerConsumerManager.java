package com.scheduler.platform.worker;

import com.scheduler.platform.domain.model.Job;
import com.scheduler.platform.domain.model.JobExecution;
import com.scheduler.platform.repository.JobRepository;
import com.scheduler.platform.repository.QueueRepository;
import com.scheduler.platform.scheduler.SchedulerProperties;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;

import com.scheduler.platform.infrastructure.redis.RedisQueueNames;

/**
 * The worker runtime: a fixed-size thread pool where each thread loops on BLPOP against
 * every active queue's Redis ready-list, executes the matching JobHandler with a
 * per-job timeout, and reports the outcome. Concurrency is bounded by pool-size, which
 * is also this worker's `max_concurrency` -- horizontal scaling is achieved by running
 * more worker processes/pods, not by growing this pool indefinitely on one machine.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.scheduler.worker", name = "enabled", havingValue = "true", matchIfMissing = true)
public class WorkerConsumerManager {

    private final StringRedisTemplate redisTemplate;
    private final JobRepository jobRepository;
    private final QueueRepository queueRepository;
    private final JobExecutionService executionService;
    private final JobCompletionService completionService;
    private final JobHandlerRegistry handlerRegistry;
    private final WorkerRegistrationService registrationService;
    private final SchedulerProperties properties;

    private ExecutorService consumerPool;
    private ExecutorService handlerPool;
    private ScheduledExecutorService leaseRenewalPool;
    private volatile boolean running = true;

    public WorkerConsumerManager(StringRedisTemplate redisTemplate, JobRepository jobRepository,
                                  QueueRepository queueRepository, JobExecutionService executionService,
                                  JobCompletionService completionService, JobHandlerRegistry handlerRegistry,
                                  WorkerRegistrationService registrationService, SchedulerProperties properties) {
        this.redisTemplate = redisTemplate;
        this.jobRepository = jobRepository;
        this.queueRepository = queueRepository;
        this.executionService = executionService;
        this.completionService = completionService;
        this.handlerRegistry = handlerRegistry;
        this.registrationService = registrationService;
        this.properties = properties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        int poolSize = properties.worker().poolSize();
        consumerPool = Executors.newFixedThreadPool(poolSize, r -> new Thread(r, "job-consumer"));
        handlerPool = Executors.newFixedThreadPool(poolSize, r -> new Thread(r, "job-handler"));
        leaseRenewalPool = Executors.newSingleThreadScheduledExecutor(r -> new Thread(r, "lease-renewer"));

        for (int i = 0; i < poolSize; i++) {
            consumerPool.submit(this::consumeLoop);
        }
        log.info("Worker consumer pool started with {} threads", poolSize);
    }

    private void consumeLoop() {
        List<String> keys = redisQueueKeys();
        while (running) {
            try {
                keys = redisQueueKeys(); // re-read periodically in case queues were added
                if (keys.isEmpty()) {
                    Thread.sleep(1000);
                    continue;
                }
                // BRPOP/BLPOP across multiple lists: Redis returns the first list that has
                // an element, blocking up to the timeout if all are empty -- this lets one
                // thread efficiently wait on many queues without busy-polling.
                var result = redisTemplate.opsForList().leftPop(keys.get(0), Duration.ofSeconds(2));
                if (result == null) continue;

                UUID jobId = UUID.fromString(result);
                handleClaimedJob(jobId);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            } catch (Exception ex) {
                log.error("Unexpected error in worker consume loop", ex);
            }
        }
    }

    private void handleClaimedJob(UUID jobId) {
        UUID workerId = registrationService.currentWorkerId();
        Optional<JobExecutionService.StartedExecution> started = executionService.tryStartExecution(jobId, workerId);
        if (started.isEmpty()) {
            return; // job was cancelled/already claimed/duplicate -- nothing to do
        }
        Job job = started.get().job();
        JobExecution execution = started.get().execution();

        MDC.put("jobId", job.getId().toString());
        MDC.put("correlationId", execution.getCorrelationId());

        // Background lease renewal: extends job.locked_until every
        // lease-renew-interval-seconds so a legitimately long-running handler is never
        // reclaimed by the reaper out from under it, while still ensuring a genuinely
        // crashed worker's lease lapses and gets reclaimed within one lease duration.
        ScheduledFuture<?> renewalTask = leaseRenewalPool.scheduleAtFixedRate(
                () -> executionService.renewLease(job.getId()),
                properties.worker().leaseRenewIntervalSeconds(),
                properties.worker().leaseRenewIntervalSeconds(),
                TimeUnit.SECONDS
        );

        Future<Map<String, Object>> future = handlerPool.submit(() -> runHandler(job, execution));
        try {
            Map<String, Object> output = future.get(job.getTimeoutSeconds(), TimeUnit.SECONDS);
            completionService.recordSuccess(job, execution, output);
        } catch (TimeoutException te) {
            future.cancel(true);
            completionService.recordFailure(job, execution, new RuntimeException("Job exceeded timeout of " + job.getTimeoutSeconds() + "s"));
        } catch (Exception ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            completionService.recordFailure(job, execution, cause);
        } finally {
            renewalTask.cancel(false);
            MDC.remove("jobId");
            MDC.remove("correlationId");
        }
    }

    private Map<String, Object> runHandler(Job job, JobExecution execution) throws Exception {
        JobHandler handler = handlerRegistry.find(job.getHandlerType())
                .orElseThrow(() -> new IllegalStateException("No JobHandler registered for type: " + job.getHandlerType()));

        JobExecutionContext context = new JobExecutionContext(
                job.getId(), job.getOrganization().getId(), job.getAttemptCount(),
                execution.getIdempotencyKey(), job.getPayload(),
                () -> executionService.renewLease(job.getId())
        );
        return handler.execute(context);
    }

    private List<String> redisQueueKeys() {
        return queueRepository.findAll().stream()
                .filter(q -> q.getState() == com.scheduler.platform.domain.model.enums.QueueState.ACTIVE)
                .map(q -> RedisQueueNames.readyList(q.getId()))
                .toList();
    }

    @PreDestroy
    public void shutdown() {
        // Graceful shutdown: stop accepting new work immediately, but let in-flight
        // handlers finish naturally up to a bounded grace period rather than killing them
        // mid-execution -- a hard kill here would strand a job in RUNNING until the
        // reaper's lease timeout, causing an avoidable duplicate execution on retry.
        running = false;
        log.info("Shutting down worker consumer pool -- allowing in-flight jobs to finish");
        shutdownAndAwait(consumerPool, 5);
        shutdownAndAwait(handlerPool, 30);
        shutdownAndAwait(leaseRenewalPool, 5);
    }

    private void shutdownAndAwait(ExecutorService pool, int seconds) {
        if (pool == null) return;
        pool.shutdown();
        try {
            if (!pool.awaitTermination(seconds, TimeUnit.SECONDS)) {
                pool.shutdownNow();
            }
        } catch (InterruptedException e) {
            pool.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
