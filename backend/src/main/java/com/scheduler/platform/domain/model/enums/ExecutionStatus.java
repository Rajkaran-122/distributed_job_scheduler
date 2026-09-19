package com.scheduler.platform.domain.model.enums;

public enum ExecutionStatus {
    CLAIMED,
    RUNNING,
    SUCCEEDED,
    FAILED,
    TIMED_OUT,
    LEASE_EXPIRED
}
