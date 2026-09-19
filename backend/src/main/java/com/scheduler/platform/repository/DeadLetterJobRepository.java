package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.DeadLetterJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DeadLetterJobRepository extends JpaRepository<DeadLetterJob, UUID> {
    Page<DeadLetterJob> findByOrganization_IdAndResolvedAtIsNullOrderByDeadLetteredAtDesc(UUID organizationId, Pageable pageable);
}
