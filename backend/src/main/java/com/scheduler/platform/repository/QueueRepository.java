package com.scheduler.platform.repository;

import com.scheduler.platform.domain.model.Queue;
import com.scheduler.platform.domain.model.enums.QueueState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QueueRepository extends JpaRepository<Queue, UUID> {
    List<Queue> findByOrganization_IdAndState(UUID organizationId, QueueState state);
    List<Queue> findByOrganization_Id(UUID organizationId);
    Optional<Queue> findByOrganization_IdAndName(UUID organizationId, String name);

    default UUID[] activeQueueIds(UUID organizationId) {
        return findByOrganization_IdAndState(organizationId, QueueState.ACTIVE)
                .stream().map(Queue::getId).toArray(UUID[]::new);
    }
}
