package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {

    /**
     * THE core query of the entire platform. Claims up to `limit` due jobs from a set of
     * queues by row-locking them with FOR UPDATE SKIP LOCKED.
     *
     * Why this works: two dispatcher/worker threads running this query concurrently will
     * never select the same row. Postgres takes a row lock on every candidate row as it's
     * scanned; SKIP LOCKED means a second transaction hitting an already-locked row simply
     * skips it and moves to the next one instead of blocking. No application-level mutex,
     * no distributed lock, no possibility of two workers both believing they claimed the
     * same job -- this is enforced by the database's MVCC row-locking, which is the
     * strongest guarantee available short of serializable isolation (which would be far
     * slower here for no extra benefit).
     *
     * This method only SELECTs and locks; the actual status/lease update happens in the
     * same @Transactional service method immediately after (see JobClaimService), so the
     * lock is held for the shortest possible window.
     *
     * Uses a native query (not JPQL) because JPQL does not support SKIP LOCKED.
     */
    @Query(value = """
            SELECT * FROM jobs
            WHERE status = 'PENDING'
              AND deleted_at IS NULL
              AND is_paused = FALSE
              AND queue_id = ANY(:queueIds)
              AND next_run_at <= :now
            ORDER BY priority ASC, next_run_at ASC
            LIMIT :limit
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<Job> findClaimableJobs(@Param("queueIds") UUID[] queueIds,
                                 @Param("now") Instant now,
                                 @Param("limit") int limit);

    /**
     * Reaper query: finds RUNNING jobs whose lease has lapsed. Backed by the partial
     * index idx_jobs_lease_expiry (WHERE status = 'RUNNING'), so this scan is proportional
     * to the currently-running set, not the whole table, no matter how many historical
     * jobs exist.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT j FROM Job j WHERE j.status = com.scheduler.platform.domain.model.enums.JobStatus.RUNNING " +
           "AND j.lockedUntil < :now")
    List<Job> findJobsWithExpiredLeases(@Param("now") Instant now);

    Optional<Job> findByIdAndOrganization_Id(UUID id, UUID organizationId);

    @Query("SELECT j FROM Job j WHERE j.organization.id = :orgId AND j.deletedAt IS NULL " +
           "AND (:status IS NULL OR j.status = :status) " +
           "AND (:queueId IS NULL OR j.queue.id = :queueId)")
    org.springframework.data.domain.Page<Job> search(@Param("orgId") UUID orgId,
                                                       @Param("status") com.scheduler.platform.domain.model.enums.JobStatus status,
                                                       @Param("queueId") UUID queueId,
                                                       org.springframework.data.domain.Pageable pageable);

    boolean existsByOrganization_IdAndUniqueKeyAndStatusIn(UUID organizationId, String uniqueKey,
                                                            List<com.scheduler.platform.domain.model.enums.JobStatus> statuses);

    long countByOrganization_IdAndStatus(UUID organizationId, com.scheduler.platform.domain.model.enums.JobStatus status);
}
