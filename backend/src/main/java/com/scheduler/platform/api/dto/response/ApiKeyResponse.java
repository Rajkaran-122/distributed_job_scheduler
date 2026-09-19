package com.scheduler.platform.api.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** `plaintextKey` is populated ONLY on the create response -- never returned again afterward. */
public record ApiKeyResponse(UUID id, String name, String keyPrefix, String plaintextKey,
                              List<String> scopes, Instant createdAt, Instant lastUsedAt) {}
