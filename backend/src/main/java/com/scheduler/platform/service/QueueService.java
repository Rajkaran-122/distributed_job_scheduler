package com.scheduler.platform.service;

import com.scheduler.platform.api.dto.request.CreateQueueRequest;
import com.scheduler.platform.api.dto.response.QueueResponse;
import com.scheduler.platform.api.exception.ConflictException;
import com.scheduler.platform.api.exception.ResourceNotFoundException;
import com.scheduler.platform.domain.model.Organization;
import com.scheduler.platform.domain.model.Queue;
import com.scheduler.platform.domain.model.enums.QueueState;
import com.scheduler.platform.repository.OrganizationRepository;
import com.scheduler.platform.repository.QueueRepository;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QueueService {

    private final QueueRepository queueRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional
    public QueueResponse create(CreateQueueRequest request) {
        UUID orgId = currentPrincipal().organizationId();
        if (queueRepository.findByOrganization_IdAndName(orgId, request.name()).isPresent()) {
            throw new ConflictException("A queue named '" + request.name() + "' already exists in this organization");
        }
        Organization org = organizationRepository.getReferenceById(orgId);
        Queue queue = Queue.builder()
                .organization(org)
                .name(request.name())
                .description(request.description())
                .maxConcurrency(request.maxConcurrency() != null ? request.maxConcurrency() : 10)
                .rateLimitPerMinute(request.rateLimitPerMinute())
                .defaultPriority(request.defaultPriority() != null ? request.defaultPriority() : 5)
                .build();
        return toResponse(queueRepository.save(queue));
    }

    @Transactional(readOnly = true)
    public List<QueueResponse> list() {
        return queueRepository.findByOrganization_Id(currentPrincipal().organizationId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public QueueResponse setPaused(UUID queueId, boolean paused) {
        Queue queue = findOwned(queueId);
        queue.setState(paused ? QueueState.PAUSED : QueueState.ACTIVE);
        return toResponse(queueRepository.save(queue));
    }

    private Queue findOwned(UUID queueId) {
        Queue queue = queueRepository.findById(queueId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue", queueId));
        if (!queue.getOrganization().getId().equals(currentPrincipal().organizationId())) {
            throw new ResourceNotFoundException("Queue", queueId);
        }
        return queue;
    }

    private TenantPrincipal currentPrincipal() {
        return (TenantPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private QueueResponse toResponse(Queue q) {
        return new QueueResponse(q.getId(), q.getName(), q.getDescription(), q.getState().name(),
                q.getMaxConcurrency(), q.getRateLimitPerMinute(), q.getDefaultPriority());
    }
}
