package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.OrgMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrgMembershipRepository extends JpaRepository<OrgMembership, UUID> {
    List<OrgMembership> findByUser_Id(UUID userId);
    Optional<OrgMembership> findByOrganization_IdAndUser_Id(UUID organizationId, UUID userId);
}
