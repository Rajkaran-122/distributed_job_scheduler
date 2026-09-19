package com.scheduler.platform.security.rbac;

import java.util.UUID;

/**
 * The authenticated principal for every request in the system, whether authenticated by
 * JWT (dashboard users) or API key (programmatic clients). Carries exactly what
 * multi-tenant authorization needs: who is calling, which organization they're acting
 * within, and what role they hold in that organization.
 */
public record TenantPrincipal(UUID userId, UUID organizationId, String role) {

    public boolean hasRole(String... anyOf) {
        for (String r : anyOf) {
            if (role.equalsIgnoreCase(r)) return true;
        }
        return false;
    }

    public boolean isAtLeast(MemberRoleLevel minimum) {
        return MemberRoleLevel.valueOf(role).ordinal() <= minimum.ordinal();
    }
}
