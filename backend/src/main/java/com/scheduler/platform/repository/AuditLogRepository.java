package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByOrganization_IdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);
}
