package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {
    List<Team> findByOrganization_Id(UUID organizationId);
}
