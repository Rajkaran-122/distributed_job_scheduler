package com.scheduler.platform.domain.model.enums;

/**
 * Job lifecycle state. Mirrors the `job_status` CHECK-constraint domain in the database
 * (see V1__extensions_and_enums.sql). Kept as a Java enum for compile-time safety in
 * business logic while the DB uses a CHECK constraint (not a native enum type) so new
 * states can be added without an ACCESS EXCLUSIVE-locking ALTER TYPE.
 */
public enum JobStatus {
    PENDING,
    SCHEDULED,
    RUNNING,
    SUCCEEDED,
    FAILED,
    RETRYING,
    DEAD_LETTERED,
    CANCELLED,
    PAUSED
}
