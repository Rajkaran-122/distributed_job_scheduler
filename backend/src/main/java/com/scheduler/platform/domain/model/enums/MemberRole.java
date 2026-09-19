package com.scheduler.platform.domain.model.enums;

/**
 * Role scoped to a single organization membership (see org_memberships table) -- a
 * user's role is never global, only per-tenant.
 */
public enum MemberRole {
    OWNER,
    ADMIN,
    DEVELOPER,
    VIEWER
}
