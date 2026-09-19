package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.JobExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobExecutionRepository extends JpaRepository<JobExecution, Long> {
    List<JobExecution> findByJob_IdOrderByAttemptNumberDesc(UUID jobId);
    Optional<JobExecution> findTopByJob_IdOrderByAttemptNumberDesc(UUID jobId);
    Page<JobExecution> findByOrganization_IdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    @Query("SELECT COUNT(e) FROM JobExecution e WHERE e.organization.id = :orgId " +
           "AND e.status = com.scheduler.platform.domain.model.enums.ExecutionStatus.FAILED " +
           "AND e.createdAt >= :since")
    long countFailuresSince(@Param("orgId") UUID orgId, @Param("since") java.time.Instant since);
}
