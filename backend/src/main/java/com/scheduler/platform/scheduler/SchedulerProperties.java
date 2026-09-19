package com.scheduler.platform.scheduler;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.scheduler")
public record SchedulerProperties(Dispatcher dispatcher, Worker worker, Reaper reaper, Retry retry) {
    public record Dispatcher(boolean enabled, long pollIntervalMs, int batchSize,
                              String leaderLockKey, int leaderLockTtlSeconds) {}
    public record Worker(boolean enabled, int poolSize, int leaseDurationSeconds,
                          int leaseRenewIntervalSeconds, int heartbeatIntervalSeconds) {}
    public record Reaper(boolean enabled, long scanIntervalMs) {}
    public record Retry(int defaultMaxAttempts, int defaultBaseDelaySeconds,
                         int defaultMaxDelaySeconds, double defaultJitterFactor) {}
}
