package com.scheduler.platform.api.dto.response;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record JobResponse(
        UUID id, String name, UUID queueId, String queueName, String handlerType, String jobType,
        Map<String, Object> payload, String cronExpression, Instant runAt, Instant nextRunAt,
        short priority, String status, int maxRetries, int attemptCount, String lastError,
        boolean isPaused, Instant createdAt, Instant updatedAt, int version
) {}
