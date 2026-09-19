package com.scheduler.platform.api.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkerResponse(UUID id, String hostname, Integer pid, String version, String status,
                              List<String> queues, int maxConcurrency, int currentLoad,
                              Instant lastHeartbeatAt, Instant registeredAt) {}
