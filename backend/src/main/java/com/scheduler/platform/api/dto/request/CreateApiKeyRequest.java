package com.scheduler.platform.api.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateApiKeyRequest(@NotBlank String name, List<String> scopes) {}
