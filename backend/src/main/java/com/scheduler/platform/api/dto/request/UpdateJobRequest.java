package com.scheduler.platform.api.dto.request;

import java.util.Map;

public record UpdateJobRequest(
        String name,
        Map<String, Object> payload,
        Short priority,
        Integer maxRetries,
        Boolean isPaused,
        int expectedVersion
) {}
