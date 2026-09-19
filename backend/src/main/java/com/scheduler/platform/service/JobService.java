package com.scheduler.platform.service;

import com.scheduler.platform.api.dto.request.CreateJobRequest;
import com.scheduler.platform.api.dto.request.UpdateJobRequest;
import com.scheduler.platform.api.dto.response.JobResponse;
import com.scheduler.platform.api.dto.response.PagedResponse;
import com.scheduler.platform.api.exception.ConflictException;
import com.scheduler.platform.api.exception.ResourceNotFoundException;
import com.scheduler.platform.api.exception.ValidationException;
import com.scheduler.platform.audit.Audited;
import com.scheduler.platform.domain.model.Job;
import com.scheduler.platform.domain.model.Queue;
import com.scheduler.platform.domain.model.enums.JobStatus;
import com.scheduler.platform.domain.model.enums.JobType;
import com.scheduler.platform.domain.policy.CronCalculator;
import com.scheduler.platform.repository.JobRepository;
import com.scheduler.platform.repository.QueueRepository;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final QueueRepository queueRepository;

    @Transactional
    @Audited(action = "job.created", resourceType = "job")
    public JobResponse createJob(CreateJobRequest request) {
        TenantPrincipal principal = currentPrincipal();
        Queue queue = queueRepository.findById(request.queueId())
                .filter(q -> q.getOrganization().getId().equals(principal.organizationId()))
                .orElseThrow(() -> new ResourceNotFoundException("Queue", request.queueId()));

        Instant nextRunAt = computeInitialNextRunAt(request);

        if (request.uniqueKey() != null) {
            boolean conflict = jobRepository.existsByOrganization_IdAndUniqueKeyAndStatusIn(
                    principal.organizationId(), request.uniqueKey(),
                    List.of(JobStatus.PENDING, JobStatus.SCHEDULED, JobStatus.RUNNING));
            if (conflict) {
                throw new ConflictException("A job with unique_key '" + request.uniqueKey() + "' is already active");
            }
        }

        Job job = Job.builder()
                .organization(queue.getOrganization())
                .queue(queue)
                .name(request.name())
                .handlerType(request.handlerType())
                .jobType(request.jobType())
                .payload(request.payload() != null ? request.payload() : java.util.Map.of())
                .cronExpression(request.cronExpression())
                .timezone(request.timezone() != null ? request.timezone() : "UTC")
                .runAt(request.runAt())
                .nextRunAt(nextRunAt)
                .priority(request.priority() != null ? request.priority() : queue.getDefaultPriority())
                .maxRetries(request.maxRetries() != null ? request.maxRetries() : 5)
                .backoffStrategy(request.backoffStrategy() != null ? request.backoffStrategy()
                        : com.scheduler.platform.domain.model.enums.BackoffStrategy.EXPONENTIAL_JITTER)
                .baseDelaySeconds(request.baseDelaySeconds() != null ? request.baseDelaySeconds() : 2)
                .maxDelaySeconds(request.maxDelaySeconds() != null ? request.maxDelaySeconds() : 3600)
                .timeoutSeconds(request.timeoutSeconds() != null ? request.timeoutSeconds() : 300)
                .uniqueKey(request.uniqueKey())
                .status(JobStatus.PENDING)
                .build();

        job = jobRepository.save(job);
        return toResponse(job);
    }

    private Instant computeInitialNextRunAt(CreateJobRequest request) {
        return switch (request.jobType()) {
            case ONE_OFF, DELAYED -> {
                if (request.runAt() == null) {
                    throw new ValidationException("runAt is required for ONE_OFF and DELAYED jobs");
                }
                yield request.runAt();
            }
            case CRON -> {
                if (request.cronExpression() == null) {
                    throw new ValidationException("cronExpression is required for CRON jobs");
                }
                String tz = request.timezone() != null ? request.timezone() : "UTC";
                yield CronCalculator.nextFireTime(request.cronExpression(), tz, Instant.now())
                        .orElseThrow(() -> new ValidationException("Cron expression has no future fire time: " + request.cronExpression()));
            }
            case EVENT -> Instant.now(); // EVENT jobs are dispatched immediately when triggered via the events API
        };
    }

    @Transactional(readOnly = true)
    public JobResponse getJob(UUID jobId) {
        Job job = jobRepository.findByIdAndOrganization_Id(jobId, currentPrincipal().organizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
        return toResponse(job);
    }

    @Transactional(readOnly = true)
    public PagedResponse<JobResponse> listJobs(JobStatus status, UUID queueId, int page, int size) {
        Page<Job> result = jobRepository.search(currentPrincipal().organizationId(), status, queueId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PagedResponse<>(result.getContent().stream().map(this::toResponse).toList(),
                page, size, result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    public JobResponse updateJob(UUID jobId, UpdateJobRequest request) {
        Job job = jobRepository.findByIdAndOrganization_Id(jobId, currentPrincipal().organizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));

        if (job.getVersion() != request.expectedVersion()) {
            throw new ConflictException("Job was modified by someone else -- reload and retry (optimistic lock mismatch)");
        }
        if (request.name() != null) job.setName(request.name());
        if (request.payload() != null) job.setPayload(request.payload());
        if (request.priority() != null) job.setPriority(request.priority());
        if (request.maxRetries() != null) job.setMaxRetries(request.maxRetries());
        if (request.isPaused() != null) job.setPaused(request.isPaused());

        job = jobRepository.save(job); // @Version bump enforces optimistic locking automatically here
        return toResponse(job);
    }

    @Transactional
    @Audited(action = "job.cancelled", resourceType = "job")
    public void cancelJob(UUID jobId) {
        Job job = jobRepository.findByIdAndOrganization_Id(jobId, currentPrincipal().organizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
        if (job.getStatus() == JobStatus.RUNNING) {
            throw new ConflictException("Cannot cancel a job that is currently RUNNING -- wait for it to complete or let the lease expire");
        }
        job.setStatus(JobStatus.CANCELLED);
        jobRepository.save(job);
    }

    private TenantPrincipal currentPrincipal() {
        return (TenantPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private JobResponse toResponse(Job job) {
        return new JobResponse(job.getId(), job.getName(), job.getQueue().getId(), job.getQueue().getName(),
                job.getHandlerType(), job.getJobType().name(), job.getPayload(), job.getCronExpression(),
                job.getRunAt(), job.getNextRunAt(), job.getPriority(), job.getStatus().name(), job.getMaxRetries(),
                job.getAttemptCount(), job.getLastError(), job.isPaused(), job.getCreatedAt(), job.getUpdatedAt(),
                job.getVersion());
    }
}
