package com.scheduler.platform.security.apikey;

import com.scheduler.platform.domain.model.ApiKey;
import com.scheduler.platform.domain.model.Organization;
import com.scheduler.platform.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Generates and validates API keys. The plaintext key is only ever held in memory for
 * the duration of key creation -- it is returned to the caller once and never persisted;
 * only its SHA-256 hash is stored, matching how Stripe/GitHub handle access tokens.
 */
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private static final String PREFIX = "sk_live_";
    private final ApiKeyRepository apiKeyRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public record GeneratedKey(String plaintext, String keyPrefix, String keyHash) {}

    public GeneratedKey generate() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String secret = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        String plaintext = PREFIX + secret;
        String displayPrefix = plaintext.substring(0, Math.min(16, plaintext.length()));
        return new GeneratedKey(plaintext, displayPrefix, sha256(plaintext));
    }

    public Optional<ApiKey> validate(String plaintextKey) {
        if (plaintextKey == null || !plaintextKey.startsWith(PREFIX)) {
            return Optional.empty();
        }
        String hash = sha256(plaintextKey);
        return apiKeyRepository.findByKeyHashAndRevokedAtIsNull(hash)
                .filter(ApiKey::isActive);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
