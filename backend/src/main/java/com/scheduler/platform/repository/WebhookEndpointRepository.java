package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.WebhookEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpoint, UUID> {
    List<WebhookEndpoint> findByOrganization_IdAndActiveTrue(UUID organizationId);
}
