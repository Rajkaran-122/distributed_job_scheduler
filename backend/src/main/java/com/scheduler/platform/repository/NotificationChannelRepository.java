package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.NotificationChannel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationChannelRepository extends JpaRepository<NotificationChannel, UUID> {
    List<NotificationChannel> findByOrganization_IdAndActiveTrue(UUID organizationId);
}
