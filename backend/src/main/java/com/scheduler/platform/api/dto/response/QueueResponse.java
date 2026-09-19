package com.scheduler.platform.api.dto.response;

import java.util.UUID;

public record QueueResponse(UUID id, String name, String description, String state,
                             int maxConcurrency, Integer rateLimitPerMinute, short defaultPriority) {}
