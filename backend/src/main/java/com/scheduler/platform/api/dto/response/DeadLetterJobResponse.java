package com.scheduler.platform.api.dto.response;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record DeadLetterJobResponse(
        UUID id,
        JobSummary job,
        int finalAttemptNumber,
        Map<String, Object> payloadSnapshot,
        String lastErrorMessage,
        String lastErrorStacktrace,
        Instant deadLetteredAt,
        Instant resolvedAt,
        String resolution
) {
    /** Minimal job projection -- avoids serializing the full lazy-loaded Job graph
     *  (queue, organization, createdBy, etc.) that the dashboard doesn't need here. */
    public record JobSummary(UUID id, String name, String handlerType, String queueName) {}
}
