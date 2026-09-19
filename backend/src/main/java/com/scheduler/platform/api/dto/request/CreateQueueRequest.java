package com.scheduler.platform.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateQueueRequest(
        @NotBlank String name,
        String description,
        @Min(1) Integer maxConcurrency,
        Integer rateLimitPerMinute,
        Short defaultPriority
) {}
