package com.scheduler.platform.scheduler;

import com.scheduler.platform.repository.QueueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The polling loop. Only acts when this instance holds dispatcher leadership (see
 * DispatcherLeaderElector) -- every other instance's poll tick is a fast no-op check of
 * a boolean, so running the dispatcher component on every backend replica is cheap and
 * requires no separate deployment/scaling story for "the dispatcher" as a service.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.scheduler.dispatcher", name = "enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class Dispatcher {

    private final DispatcherLeaderElector leaderElector;
    private final JobDispatchService dispatchService;
    private final QueueRepository queueRepository;
    private final SchedulerProperties properties;

    @Scheduled(fixedDelayString = "${app.scheduler.dispatcher.poll-interval-ms}")
    public void poll() {
        if (!leaderElector.isLeader()) {
            return;
        }
        try {
            // In a single-node/dev deployment there is one implicit "system" scope; in
            // production this loop is organization-agnostic by design -- jobs.next_run_at
            // is queried across ALL active queues regardless of tenant, since the claim
            // query is already indexed on (queue_id, priority, next_run_at) and tenant
            // isolation is enforced at the queue_id level, not by looping per-tenant here.
            List<UUID> allActiveQueueIds = queueRepository.findAll().stream()
                    .filter(q -> q.getState() == com.scheduler.platform.domain.model.enums.QueueState.ACTIVE)
                    .map(com.scheduler.platform.domain.model.Queue::getId)
                    .collect(Collectors.toList());

            dispatchService.claimAndDispatch(allActiveQueueIds.toArray(new UUID[0]),
                    properties.dispatcher().batchSize());
        } catch (Exception ex) {
            // A single failed poll cycle must never kill the @Scheduled loop -- log and
            // let the next tick retry rather than propagating and silently stopping
            // all future dispatching until the process restarts.
            log.error("Dispatcher poll cycle failed", ex);
        }
    }
}
