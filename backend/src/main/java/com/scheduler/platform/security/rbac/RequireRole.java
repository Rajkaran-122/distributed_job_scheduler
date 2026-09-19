package com.scheduler.platform.security.rbac;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Method-level RBAC guard, e.g. @RequireRole(MemberRoleLevel.ADMIN) on a controller
 * method requires the caller to be ADMIN or OWNER. Enforced by RbacAspect via Spring AOP
 * -- kept declarative on the controller rather than scattered `if (!principal.isAtLeast(...))`
 * checks throughout service methods.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RequireRole {
    MemberRoleLevel value();
}
