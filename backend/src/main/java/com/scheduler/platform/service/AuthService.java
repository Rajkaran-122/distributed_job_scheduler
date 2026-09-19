package com.scheduler.platform.service;

import com.scheduler.platform.api.dto.request.LoginRequest;
import com.scheduler.platform.api.dto.request.RegisterRequest;
import com.scheduler.platform.api.dto.response.AuthResponse;
import com.scheduler.platform.api.dto.response.UserResponse;
import com.scheduler.platform.api.exception.ConflictException;
import com.scheduler.platform.api.exception.ForbiddenException;
import com.scheduler.platform.api.exception.ResourceNotFoundException;
import com.scheduler.platform.domain.model.*;
import com.scheduler.platform.domain.model.enums.MemberRole;
import com.scheduler.platform.repository.*;
import com.scheduler.platform.security.jwt.JwtProperties;
import com.scheduler.platform.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrgMembershipRepository membershipRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }

        String slug = slugify(request.organizationName());
        Organization org = organizationRepository.save(Organization.builder()
                .name(request.organizationName())
                .slug(uniqueSlug(slug))
                .build());

        User user = userRepository.save(User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .emailVerifiedAt(null)
                .build());

        // The user who registers and creates the organization is always its OWNER --
        // the highest-privilege role, since they are the first (and initially only) member.
        membershipRepository.save(OrgMembership.builder()
                .organization(org).user(user).role(MemberRole.OWNER).build());

        return issueTokens(user, org, MemberRole.OWNER.name());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(request.email())
                .orElseThrow(() -> new ForbiddenException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ForbiddenException("Invalid email or password");
        }
        if (!user.isActive()) {
            throw new ForbiddenException("This account has been deactivated");
        }

        List<OrgMembership> memberships = membershipRepository.findByUser_Id(user.getId());
        if (memberships.isEmpty()) {
            throw new ForbiddenException("User does not belong to any organization");
        }
        // Default to the first membership found; a future "switch organization" endpoint
        // can re-issue tokens scoped to a different membership for multi-org users.
        OrgMembership membership = memberships.get(0);

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return issueTokens(user, membership.getOrganization(), membership.getRole().name());
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String hash = sha256(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ForbiddenException("Invalid refresh token"));

        if (!stored.isValid()) {
            throw new ForbiddenException("Refresh token expired or revoked");
        }

        // Rotate on every use: revoke the old token and issue a brand new one. This
        // limits the blast radius of a leaked refresh token to a single use before
        // detection (reuse of a revoked token is a strong signal of token theft).
        stored.setRevokedAt(Instant.now());
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        List<OrgMembership> memberships = membershipRepository.findByUser_Id(user.getId());
        OrgMembership membership = memberships.get(0);

        return issueTokens(user, membership.getOrganization(), membership.getRole().name());
    }

    @Transactional
    public void revokeAllSessions(java.util.UUID userId) {
        refreshTokenRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(userId) && t.isValid())
                .forEach(t -> t.setRevokedAt(Instant.now()));
    }

    private AuthResponse issueTokens(User user, Organization org, String role) {
        String accessToken = tokenProvider.generateAccessToken(user.getId(), org.getId(), role);

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawRefreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .tokenHash(sha256(rawRefreshToken))
                .expiresAt(Instant.now().plus(jwtProperties.refreshTokenTtlDays(), ChronoUnit.DAYS))
                .build());

        return new AuthResponse(
                accessToken, rawRefreshToken, jwtProperties.accessTokenTtlMinutes() * 60L,
                new UserResponse(user.getId(), user.getEmail(), user.getFullName(), org.getId(), role)
        );
    }

    private String uniqueSlug(String base) {
        String candidate = base;
        int suffix = 1;
        while (organizationRepository.findBySlugAndDeletedAtIsNull(candidate).isPresent()) {
            candidate = base + "-" + (++suffix);
        }
        return candidate;
    }

    private String slugify(String input) {
        return input.toLowerCase().trim().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
