package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.Worker;
import com.scheduler.platform.domain.model.enums.WorkerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface WorkerRepository extends JpaRepository<Worker, UUID> {
    List<Worker> findByStatus(WorkerStatus status);

    @Query("SELECT w FROM Worker w WHERE w.status = com.scheduler.platform.domain.model.enums.WorkerStatus.ACTIVE " +
           "AND w.lastHeartbeatAt < :threshold")
    List<Worker> findStaleActiveWorkers(@Param("threshold") Instant threshold);
}
