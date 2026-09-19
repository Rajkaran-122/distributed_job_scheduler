package com.scheduler.platform.worker;

import com.scheduler.platform.domain.model.Worker;
import com.scheduler.platform.domain.model.enums.WorkerStatus;
import com.scheduler.platform.repository.WorkerRepository;
import com.scheduler.platform.scheduler.SchedulerProperties;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Registers this process in the `workers` table on boot (auto-registration), sends
 * periodic heartbeats for dashboard observability, and deregisters cleanly on graceful
 * shutdown. This table is NOT consulted for job-ownership correctness (see Job entity
 * javadoc) -- purely fleet visibility.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.scheduler.worker", name = "enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class WorkerRegistrationService {

    private final WorkerRepository workerRepository;
    private final SchedulerProperties properties;
    private final AtomicReference<UUID> workerId = new AtomicReference<>();

    @EventListener(ApplicationReadyEvent.class)
    public void registerOnStartup() {
        String hostname = resolveHostname();
        Worker worker = Worker.builder()
                .hostname(hostname)
                .pid((int) ProcessHandle.current().pid())
                .status(WorkerStatus.ACTIVE)
                .queues(List.of()) // consumes from all active queues by default; see WorkerConsumerManager
                .maxConcurrency(properties.worker().poolSize())
                .currentLoad(0)
                .lastHeartbeatAt(Instant.now())
                .build();
        worker = workerRepository.save(worker);
        workerId.set(worker.getId());
        log.info("Worker registered: id={} hostname={} poolSize={}", worker.getId(), hostname, properties.worker().poolSize());
    }

    public UUID currentWorkerId() {
        return workerId.get();
    }

    @Scheduled(fixedDelayString = "${app.scheduler.worker.heartbeat-interval-ms}")
    public void heartbeat() {
        UUID id = workerId.get();
        if (id == null) return;
        workerRepository.findById(id).ifPresent(w -> {
            w.setLastHeartbeatAt(Instant.now());
            workerRepository.save(w);
        });
    }

    @PreDestroy
    public void deregisterOnShutdown() {
        UUID id = workerId.get();
        if (id == null) return;
        workerRepository.findById(id).ifPresent(w -> {
            w.setStatus(WorkerStatus.DRAINING);
            w.setDeregisteredAt(Instant.now());
            workerRepository.save(w);
        });
        log.info("Worker {} deregistered on graceful shutdown", id);
    }

    private String resolveHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "unknown-" + UUID.randomUUID();
        }
    }
}
