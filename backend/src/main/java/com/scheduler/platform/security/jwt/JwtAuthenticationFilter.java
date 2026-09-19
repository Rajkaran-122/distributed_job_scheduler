package com.scheduler.platform.security.jwt;

import com.scheduler.platform.security.rbac.TenantPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Validates the Bearer JWT on every request and populates the SecurityContext with a
 * TenantPrincipal carrying (userId, organizationId, role) -- this is what makes
 * multi-tenant row scoping possible downstream: every service method can pull the
 * caller's organizationId from SecurityContextHolder rather than trusting a
 * client-supplied org id in the request body/path.
 *
 * API-key authentication is handled by a separate filter (ApiKeyAuthenticationFilter)
 * that runs before this one and short-circuits if an X-API-Key header is present, so a
 * single request is authenticated by exactly one mechanism.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7);
            try {
                Claims claims = tokenProvider.parseAndValidate(token);
                UUID userId = tokenProvider.extractUserId(claims);
                UUID orgId = tokenProvider.extractOrganizationId(claims);
                String role = tokenProvider.extractRole(claims);

                TenantPrincipal principal = new TenantPrincipal(userId, orgId, role);
                var authToken = new UsernamePasswordAuthenticationToken(
                        principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                SecurityContextHolder.getContext().setAuthentication(authToken);

                // Correlation/tenant context propagated into logs for every downstream call
                MDC.put("tenantId", orgId.toString());
                MDC.put("userId", userId.toString());
            } catch (JwtException | IllegalArgumentException ex) {
                // Invalid/expired token: leave SecurityContext empty, let the
                // authorization layer reject with 401 rather than throwing here.
                SecurityContextHolder.clearContext();
            }
        }

        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("tenantId");
            MDC.remove("userId");
        }
    }
}
