package com.scheduler.platform.security.apikey;

import com.scheduler.platform.domain.model.ApiKey;
import com.scheduler.platform.repository.ApiKeyRepository;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Authenticates programmatic API clients via the `X-API-Key` header. Runs before
 * JwtAuthenticationFilter in the chain and, if a key is present and valid, short-circuits
 * JWT processing -- a single request is authenticated by exactly one mechanism, never both.
 */
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private final ApiKeyService apiKeyService;
    private final ApiKeyRepository apiKeyRepository;

    public ApiKeyAuthenticationFilter(ApiKeyService apiKeyService, ApiKeyRepository apiKeyRepository) {
        this.apiKeyService = apiKeyService;
        this.apiKeyRepository = apiKeyRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String headerKey = request.getHeader("X-API-Key");
        if (headerKey != null) {
            Optional<ApiKey> apiKey = apiKeyService.validate(headerKey);
            if (apiKey.isPresent()) {
                ApiKey key = apiKey.get();
                // Scopes map to a coarse "role" for the RBAC layer: an API key acts as
                // DEVELOPER by default (can manage jobs) unless scoped down/up explicitly.
                String effectiveRole = key.getScopes().contains("jobs:admin") ? "ADMIN" : "DEVELOPER";
                TenantPrincipal principal = new TenantPrincipal(
                        key.getCreatedBy() != null ? key.getCreatedBy().getId() : null,
                        key.getOrganization().getId(),
                        effectiveRole
                );
                var authToken = new UsernamePasswordAuthenticationToken(
                        principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + effectiveRole)));
                SecurityContextHolder.getContext().setAuthentication(authToken);

                key.setLastUsedAt(Instant.now());
                apiKeyRepository.save(key);
            }
        }
        chain.doFilter(request, response);
    }
}
