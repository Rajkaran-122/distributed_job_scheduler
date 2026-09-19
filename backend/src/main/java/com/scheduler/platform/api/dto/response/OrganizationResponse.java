package com.scheduler.platform.api.dto.response;

import java.time.Instant;
import java.util.UUID;

public record OrganizationResponse(UUID id, String name, String slug, String plan, Instant createdAt) {}
