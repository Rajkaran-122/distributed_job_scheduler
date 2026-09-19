package com.scheduler.platform.api.controller;

import com.scheduler.platform.api.dto.request.CreateJobRequest;
import com.scheduler.platform.api.dto.request.UpdateJobRequest;
import com.scheduler.platform.api.dto.response.JobResponse;
import com.scheduler.platform.api.dto.response.PagedResponse;
import com.scheduler.platform.domain.model.enums.JobStatus;
import com.scheduler.platform.security.rbac.MemberRoleLevel;
import com.scheduler.platform.security.rbac.RequireRole;
import com.scheduler.platform.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs")
public class JobController {

    private final JobService jobService;

    @PostMapping
    @RequireRole(MemberRoleLevel.DEVELOPER)
    @Operation(summary = "Create a new job (one-off, delayed, cron, or event)")
    public ResponseEntity<JobResponse> create(@Valid @RequestBody CreateJobRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createJob(request));
    }

    @GetMapping("/{jobId}")
    @Operation(summary = "Get a single job by id")
    public ResponseEntity<JobResponse> get(@PathVariable UUID jobId) {
        return ResponseEntity.ok(jobService.getJob(jobId));
    }

    @GetMapping
    @Operation(summary = "List jobs with optional status/queue filtering and pagination")
    public ResponseEntity<PagedResponse<JobResponse>> list(
            @RequestParam(required = false) JobStatus status,
            @RequestParam(required = false) UUID queueId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(jobService.listJobs(status, queueId, page, Math.min(size, 100)));
    }

    @PatchMapping("/{jobId}")
    @RequireRole(MemberRoleLevel.DEVELOPER)
    @Operation(summary = "Update job configuration (optimistic-locked via expectedVersion)")
    public ResponseEntity<JobResponse> update(@PathVariable UUID jobId, @Valid @RequestBody UpdateJobRequest request) {
        return ResponseEntity.ok(jobService.updateJob(jobId, request));
    }

    @DeleteMapping("/{jobId}")
    @RequireRole(MemberRoleLevel.DEVELOPER)
    @Operation(summary = "Cancel a job (only PENDING/SCHEDULED/RETRYING jobs may be cancelled)")
    public ResponseEntity<Void> cancel(@PathVariable UUID jobId) {
        jobService.cancelJob(jobId);
        return ResponseEntity.noContent().build();
    }
}
