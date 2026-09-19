package com.scheduler.platform.api.dto.response;

import java.time.Instant;
import java.util.UUID;

public record JobExecutionResponse(
        Long id, UUID jobId, int attemptNumber, String status, UUID workerId,
        Instant startedAt, Instant finishedAt, Integer durationMs, String errorMessage
) {}
