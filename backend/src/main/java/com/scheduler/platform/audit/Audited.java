package com.scheduler.platform.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a service method as audit-worthy. AuditAspect writes an audit_logs row after
 * the method returns successfully. Kept declarative and separate from business logic --
 * per the module-boundary decision, audit is a cross-cutting concern, never called
 * directly by services.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Audited {
    String action();
    String resourceType();
}
