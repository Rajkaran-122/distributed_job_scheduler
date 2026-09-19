package com.scheduler.platform.api.controller;

import com.scheduler.platform.api.dto.response.AuditLogResponse;
import com.scheduler.platform.api.dto.response.PagedResponse;
import com.scheduler.platform.domain.model.AuditLog;
import com.scheduler.platform.repository.AuditLogRepository;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @Operation(summary = "List audit log entries for the current organization, most recent first")
    public ResponseEntity<PagedResponse<AuditLogResponse>> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        TenantPrincipal principal = (TenantPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Page<AuditLog> result = auditLogRepository.findByOrganization_IdOrderByCreatedAtDesc(
                principal.organizationId(), PageRequest.of(page, Math.min(size, 100)));

        var content = result.getContent().stream().map(this::toResponse).toList();
        return ResponseEntity.ok(new PagedResponse<>(content, page, size, result.getTotalElements(), result.getTotalPages()));
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(log.getId(), log.getAction(), log.getResourceType(), log.getResourceId(),
                log.getActorUser() != null ? log.getActorUser().getEmail() : null,
                log.getIpAddress(), log.getCorrelationId(), log.getCreatedAt());
    }
}
