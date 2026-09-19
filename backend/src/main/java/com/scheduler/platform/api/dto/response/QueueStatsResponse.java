package com.scheduler.platform.api.dto.response;

import java.util.UUID;

public record QueueStatsResponse(UUID queueId, String queueName, long pending, long running,
                                  long succeededLast24h, long failedLast24h, long deadLetteredTotal) {}
