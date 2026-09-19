package com.scheduler.platform.security.rbac;

/**
 * Ordered by descending privilege (ordinal 0 = most privileged) so `isAtLeast` can be
 * expressed as a simple ordinal comparison rather than a lookup table.
 */
public enum MemberRoleLevel {
    OWNER,
    ADMIN,
    DEVELOPER,
    VIEWER
}
