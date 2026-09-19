package com.scheduler.platform.api.dto.response;

import java.util.UUID;

public record UserResponse(UUID id, String email, String fullName, UUID organizationId, String role) {}
