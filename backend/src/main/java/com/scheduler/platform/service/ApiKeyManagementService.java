package com.scheduler.platform.service;

import com.scheduler.platform.api.dto.request.CreateApiKeyRequest;
import com.scheduler.platform.api.dto.response.ApiKeyResponse;
import com.scheduler.platform.api.exception.ResourceNotFoundException;
import com.scheduler.platform.audit.Audited;
import com.scheduler.platform.domain.model.ApiKey;
import com.scheduler.platform.repository.ApiKeyRepository;
import com.scheduler.platform.repository.OrganizationRepository;
import com.scheduler.platform.repository.UserRepository;
import com.scheduler.platform.security.apikey.ApiKeyService;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyManagementService {

    private final ApiKeyRepository apiKeyRepository;
    private final ApiKeyService apiKeyService;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Transactional
    public ApiKeyResponse create(CreateApiKeyRequest request) {
        TenantPrincipal principal = currentPrincipal();
        ApiKeyService.GeneratedKey generated = apiKeyService.generate();

        ApiKey apiKey = ApiKey.builder()
                .organization(organizationRepository.getReferenceById(principal.organizationId()))
                .createdBy(principal.userId() != null ? userRepository.getReferenceById(principal.userId()) : null)
                .name(request.name())
                .keyPrefix(generated.keyPrefix())
                .keyHash(generated.keyHash())
                .scopes(request.scopes() != null ? request.scopes() : List.of("jobs:read", "jobs:write"))
                .build();
        apiKey = apiKeyRepository.save(apiKey);

        // plaintext is returned exactly once, here, and never again -- see ApiKey entity javadoc.
        return new ApiKeyResponse(apiKey.getId(), apiKey.getName(), apiKey.getKeyPrefix(),
                generated.plaintext(), apiKey.getScopes(), apiKey.getCreatedAt(), null);
    }

    @Transactional
    @Audited(action = "api_key.revoked", resourceType = "api_key")
    public void revoke(UUID apiKeyId) {
        ApiKey apiKey = apiKeyRepository.findById(apiKeyId)
                .orElseThrow(() -> new ResourceNotFoundException("ApiKey", apiKeyId));
        if (!apiKey.getOrganization().getId().equals(currentPrincipal().organizationId())) {
            throw new ResourceNotFoundException("ApiKey", apiKeyId);
        }
        apiKey.setRevokedAt(Instant.now());
        apiKeyRepository.save(apiKey);
        // NOTE: production deployments should also synchronously evict any cache entry
        // keyed on this key's hash here -- see api_keys table comment on immediate revocation.
    }

    private TenantPrincipal currentPrincipal() {
        return (TenantPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
