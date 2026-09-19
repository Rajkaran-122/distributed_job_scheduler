package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    Optional<Organization> findBySlugAndDeletedAtIsNull(String slug);
}
