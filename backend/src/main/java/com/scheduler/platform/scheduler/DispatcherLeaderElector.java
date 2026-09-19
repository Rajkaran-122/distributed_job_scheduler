package com.scheduler.platform.scheduler;

import com.scheduler.platform.infrastructure.redis.RedisDistributedLock;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Leader election for the dispatcher. Multiple backend instances may run in the cluster,
 * but only ONE should actively poll and dispatch jobs at a time -- otherwise two
 * dispatchers would both try to claim the same due jobs (harmless, since SKIP LOCKED
 * still prevents double-claiming, but wasteful) and, more importantly, both would try to
 * push the same job onto the Redis queue twice.
 *
 * Mirrors how Kubernetes controllers and Temporal's matching service perform leader
 * election via a renewable lease: hold a TTL'd lock, renew it faster than it expires,
 * and if this instance stops renewing (crash, GC pause, network partition), another
 * instance acquires the lock automatically once the TTL lapses -- no manual failover step.
 */
@Slf4j
@Component
public class DispatcherLeaderElector {

    private final RedisDistributedLock distributedLock;
    private final SchedulerProperties properties;
    private final AtomicReference<RedisDistributedLock.Lock> currentLock = new AtomicReference<>();

    public DispatcherLeaderElector(RedisDistributedLock distributedLock, SchedulerProperties properties) {
        this.distributedLock = distributedLock;
        this.properties = properties;
    }

    public boolean isLeader() {
        return currentLock.get() != null;
    }

    /** Runs at roughly half the lock TTL so renewal happens well before expiry under normal conditions. */
    @Scheduled(fixedDelayString = "${app.scheduler.dispatcher.leader-lock-renewal-interval-ms}")
    public void electOrRenew() {
        Duration ttl = Duration.ofSeconds(properties.dispatcher().leaderLockTtlSeconds());
        RedisDistributedLock.Lock lock = currentLock.get();

        if (lock != null) {
            boolean renewed = distributedLock.renew(lock, ttl);
            if (!renewed) {
                log.warn("Lost dispatcher leadership (renewal failed) -- stepping down");
                currentLock.set(null);
            }
            return;
        }

        Optional<RedisDistributedLock.Lock> acquired =
                distributedLock.tryAcquire(properties.dispatcher().leaderLockKey(), ttl);
        acquired.ifPresent(l -> {
            log.info("Acquired dispatcher leadership");
            currentLock.set(l);
        });
    }

    @PreDestroy
    public void releaseOnShutdown() {
        RedisDistributedLock.Lock lock = currentLock.getAndSet(null);
        if (lock != null) {
            log.info("Releasing dispatcher leadership on graceful shutdown");
            distributedLock.release(lock);
        }
    }
}
