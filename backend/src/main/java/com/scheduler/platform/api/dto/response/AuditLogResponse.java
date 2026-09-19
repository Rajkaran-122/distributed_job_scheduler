package com.scheduler.platform.api.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(Long id, String action, String resourceType, UUID resourceId,
                                String actorEmail, String ipAddress, String correlationId, Instant createdAt) {}
