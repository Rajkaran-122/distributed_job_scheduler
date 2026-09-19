package com.scheduler.platform.api.exception;

/** Thrown for state conflicts, e.g. a duplicate unique_key job already active, or a
 *  concurrent edit losing an optimistic-lock race (mapped to 409). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
