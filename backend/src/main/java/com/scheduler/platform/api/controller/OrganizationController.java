package com.scheduler.platform.api.controller;

import com.scheduler.platform.api.dto.response.OrganizationResponse;
import com.scheduler.platform.api.exception.ResourceNotFoundException;
import com.scheduler.platform.repository.OrganizationRepository;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
@Tag(name = "Organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;

    @GetMapping("/me")
    @Operation(summary = "Get the current caller's organization profile")
    public ResponseEntity<OrganizationResponse> me() {
        TenantPrincipal principal = (TenantPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var org = organizationRepository.findById(principal.organizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization", principal.organizationId()));
        return ResponseEntity.ok(new OrganizationResponse(org.getId(), org.getName(), org.getSlug(), org.getPlan(), org.getCreatedAt()));
    }
}
