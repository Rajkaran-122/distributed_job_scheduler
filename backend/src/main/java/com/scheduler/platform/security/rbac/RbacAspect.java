package com.scheduler.platform.security.rbac;

import com.scheduler.platform.api.exception.ForbiddenException;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class RbacAspect {

    @Before("@annotation(requireRole)")
    public void checkRole(JoinPoint joinPoint, RequireRole requireRole) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof TenantPrincipal principal)) {
            throw new ForbiddenException("No authenticated tenant principal present");
        }
        if (!principal.isAtLeast(requireRole.value())) {
            throw new ForbiddenException(
                    "Role " + principal.role() + " does not meet required level " + requireRole.value());
        }
    }
}
