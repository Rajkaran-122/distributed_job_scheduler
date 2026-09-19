package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.AiInsight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiInsightRepository extends JpaRepository<AiInsight, java.util.UUID> {
    Optional<AiInsight> findByInsightTypeAndInputFingerprintAndExpiresAtAfter(
            String insightType, String inputFingerprint, java.time.Instant now);
}
