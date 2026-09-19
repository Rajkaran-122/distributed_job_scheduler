package com.scheduler.platform.audit;

import com.scheduler.platform.domain.model.AuditLog;
import com.scheduler.platform.repository.AuditLogRepository;
import com.scheduler.platform.repository.OrganizationRepository;
import com.scheduler.platform.repository.UserRepository;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.MDC;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    // REQUIRES_NEW: an audit-log write must never be rolled back by (nor roll back)
    // the business transaction it's describing, and a failure writing the audit
    // record itself must never fail the original request.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @AfterReturning(pointcut = "@annotation(audited)", returning = "result")
    public void logAudit(JoinPoint joinPoint, Audited audited, Object result) {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !(auth.getPrincipal() instanceof TenantPrincipal principal)) {
                return; // system-initiated action (e.g. reaper) -- not tied to a human actor
            }

            AuditLog entry = AuditLog.builder()
                    .organization(organizationRepository.getReferenceById(principal.organizationId()))
                    .actorUser(principal.userId() != null ? userRepository.getReferenceById(principal.userId()) : null)
                    .action(audited.action())
                    .resourceType(audited.resourceType())
                    .correlationId(MDC.get("correlationId"))
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception ex) {
            // Never let audit logging break the request it's observing.
            log.warn("Failed to write audit log for action={}", audited.action(), ex);
        }
    }
}
