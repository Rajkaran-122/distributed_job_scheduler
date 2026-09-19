package com.scheduler.platform.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and validates short-lived JWT access tokens. Refresh tokens are deliberately
 * NOT JWTs -- they are opaque random strings stored (hashed) in the refresh_tokens table
 * so they can be revoked server-side immediately (see RefreshToken entity javadoc).
 *
 * Written against the jjwt 0.12.x fluent API (Jwts.parser()/.verifyWith()/.parseSignedClaims(),
 * not the pre-0.12 Jwts.parserBuilder()/.setSigningKey()/.parseClaimsJws() API, which jjwt
 * 0.12 removed -- see pom.xml's jjwt.version).
 */
@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final JwtProperties properties;

    public JwtTokenProvider(JwtProperties properties) {
        this.properties = properties;
        // HS256 requires a key >= 256 bits; validated at startup so a misconfigured
        // short secret fails fast instead of producing forgeable tokens.
        byte[] keyBytes = properties.secret().getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("app.security.jwt.secret must be at least 256 bits (32 bytes)");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(UUID userId, UUID organizationId, String role) {
        Instant now = Instant.now();
        Instant expiry = now.plus(properties.accessTokenTtlMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(userId.toString())
                .issuer(properties.issuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claim("orgId", organizationId.toString())
                .claim("role", role)
                .claim("type", "access")
                .signWith(signingKey) // algorithm (HS256) is inferred from the SecretKey's type/size
                .compact();
    }

    public Claims parseAndValidate(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(properties.issuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public UUID extractOrganizationId(Claims claims) {
        return UUID.fromString(claims.get("orgId", String.class));
    }

    public String extractRole(Claims claims) {
        return claims.get("role", String.class);
    }
}
