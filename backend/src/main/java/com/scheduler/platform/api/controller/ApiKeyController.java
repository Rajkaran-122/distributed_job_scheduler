package com.scheduler.platform.api.controller;

import com.scheduler.platform.api.dto.request.CreateApiKeyRequest;
import com.scheduler.platform.api.dto.response.ApiKeyResponse;
import com.scheduler.platform.security.rbac.MemberRoleLevel;
import com.scheduler.platform.security.rbac.RequireRole;
import com.scheduler.platform.service.ApiKeyManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/api-keys")
@RequiredArgsConstructor
@Tag(name = "API Keys")
public class ApiKeyController {

    private final ApiKeyManagementService apiKeyManagementService;

    @PostMapping
    @RequireRole(MemberRoleLevel.ADMIN)
    @Operation(summary = "Create a new API key. The plaintext key is returned ONLY in this response.")
    public ResponseEntity<ApiKeyResponse> create(@Valid @RequestBody CreateApiKeyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(apiKeyManagementService.create(request));
    }

    @DeleteMapping("/{id}")
    @RequireRole(MemberRoleLevel.ADMIN)
    @Operation(summary = "Revoke an API key immediately")
    public ResponseEntity<Void> revoke(@PathVariable UUID id) {
        apiKeyManagementService.revoke(id);
        return ResponseEntity.noContent().build();
    }
}
