package com.scheduler.platform.domain.model.enums;

public enum BackoffStrategy {
    FIXED,
    LINEAR,
    EXPONENTIAL,
    EXPONENTIAL_JITTER
}
