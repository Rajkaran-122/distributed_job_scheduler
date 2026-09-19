package com.scheduler.platform.api.dto.request;

import com.scheduler.platform.domain.model.enums.BackoffStrategy;
import com.scheduler.platform.domain.model.enums.JobType;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record CreateJobRequest(
        @NotBlank String name,
        @NotNull UUID queueId,
        @NotBlank String handlerType,
        @NotNull JobType jobType,
        Map<String, Object> payload,
        String cronExpression,
        String timezone,
        Instant runAt,
        @Min(1) @Max(10) Short priority,
        @Min(0) Integer maxRetries,
        BackoffStrategy backoffStrategy,
        @Min(1) Integer baseDelaySeconds,
        @Min(1) Integer maxDelaySeconds,
        @Min(1) Integer timeoutSeconds,
        String uniqueKey
) {}
