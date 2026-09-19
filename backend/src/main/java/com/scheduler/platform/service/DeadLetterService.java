package com.scheduler.platform.service;

import com.scheduler.platform.api.dto.response.DeadLetterJobResponse;
import com.scheduler.platform.api.dto.response.PagedResponse;
import com.scheduler.platform.api.exception.ConflictException;
import com.scheduler.platform.api.exception.ResourceNotFoundException;
import com.scheduler.platform.domain.model.DeadLetterJob;
import com.scheduler.platform.domain.model.Job;
import com.scheduler.platform.domain.model.enums.JobStatus;
import com.scheduler.platform.repository.DeadLetterJobRepository;
import com.scheduler.platform.repository.JobRepository;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeadLetterService {

    private final DeadLetterJobRepository deadLetterJobRepository;
    private final JobRepository jobRepository;

    @Transactional(readOnly = true)
    public PagedResponse<DeadLetterJobResponse> list(int page, int size) {
        var result = deadLetterJobRepository.findByOrganization_IdAndResolvedAtIsNullOrderByDeadLetteredAtDesc(
                currentPrincipal().organizationId(), PageRequest.of(page, size));
        // Mapped to a DTO inside the read transaction, while dlq.getJob() is still a live
        // lazy proxy -- returning the entity directly (as this endpoint originally did)
        // would either throw LazyInitializationException once the session closes, or
        // serialize the entire Job/Queue/Organization graph verbatim to the client.
        var content = result.getContent().stream().map(this::toResponse).toList();
        return new PagedResponse<>(content, page, size, result.getTotalElements(), result.getTotalPages());
    }

    private DeadLetterJobResponse toResponse(DeadLetterJob dlq) {
        Job job = dlq.getJob();
        var jobSummary = new DeadLetterJobResponse.JobSummary(
                job.getId(), job.getName(), job.getHandlerType(), job.getQueue().getName());
        return new DeadLetterJobResponse(dlq.getId(), jobSummary, dlq.getFinalAttemptNumber(),
                dlq.getPayloadSnapshot(), dlq.getLastErrorMessage(), dlq.getLastErrorStacktrace(),
                dlq.getDeadLetteredAt(), dlq.getResolvedAt(), dlq.getResolution());
    }

    /**
     * Requeues a dead-lettered job by resetting the ORIGINAL job row back to PENDING with
     * a fresh attempt counter -- rather than mutating the immutable dead_letter_jobs
     * snapshot, which stays as-is for audit purposes (see V7 migration comment).
     */
    @Transactional
    public void requeue(UUID dlqId) {
        DeadLetterJob dlq = deadLetterJobRepository.findById(dlqId)
                .orElseThrow(() -> new ResourceNotFoundException("DeadLetterJob", dlqId));
        if (!dlq.getOrganization().getId().equals(currentPrincipal().organizationId())) {
            throw new ResourceNotFoundException("DeadLetterJob", dlqId);
        }
        if (dlq.getResolvedAt() != null) {
            throw new ConflictException("This dead-lettered job has already been resolved");
        }

        Job job = dlq.getJob();
        job.setStatus(JobStatus.PENDING);
        job.setAttemptCount(0);
        job.setLastError(null);
        job.setNextRunAt(Instant.now());
        jobRepository.save(job);

        dlq.setResolvedAt(Instant.now());
        dlq.setResolution("REQUEUED");
        deadLetterJobRepository.save(dlq);
    }

    @Transactional
    public void discard(UUID dlqId) {
        DeadLetterJob dlq = deadLetterJobRepository.findById(dlqId)
                .orElseThrow(() -> new ResourceNotFoundException("DeadLetterJob", dlqId));
        dlq.setResolvedAt(Instant.now());
        dlq.setResolution("DISCARDED");
        deadLetterJobRepository.save(dlq);
    }

    private TenantPrincipal currentPrincipal() {
        return (TenantPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
