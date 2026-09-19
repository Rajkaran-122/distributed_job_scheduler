package com.scheduler.platform.api.dto.response;

public record AuthResponse(String accessToken, String refreshToken, long expiresInSeconds, UserResponse user) {}
