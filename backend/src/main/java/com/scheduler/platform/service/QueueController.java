package com.scheduler.platform.api.controller;

import com.scheduler.platform.api.dto.request.CreateQueueRequest;
import com.scheduler.platform.api.dto.response.QueueResponse;
import com.scheduler.platform.security.rbac.MemberRoleLevel;
import com.scheduler.platform.security.rbac.RequireRole;
import com.scheduler.platform.service.QueueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/queues")
@RequiredArgsConstructor
@Tag(name = "Queues")
public class QueueController {

    private final QueueService queueService;

    @PostMapping
    @RequireRole(MemberRoleLevel.ADMIN)
    @Operation(summary = "Create a new queue")
    public ResponseEntity<QueueResponse> create(@Valid @RequestBody CreateQueueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(queueService.create(request));
    }

    @GetMapping
    @Operation(summary = "List all queues for the current organization")
    public ResponseEntity<List<QueueResponse>> list() {
        return ResponseEntity.ok(queueService.list());
    }

    @PostMapping("/{queueId}/pause")
    @RequireRole(MemberRoleLevel.ADMIN)
    @Operation(summary = "Pause a queue -- the dispatcher stops claiming new jobs from it; in-flight jobs are unaffected")
    public ResponseEntity<QueueResponse> pause(@PathVariable UUID queueId) {
        return ResponseEntity.ok(queueService.setPaused(queueId, true));
    }

    @PostMapping("/{queueId}/resume")
    @RequireRole(MemberRoleLevel.ADMIN)
    @Operation(summary = "Resume a paused queue")
    public ResponseEntity<QueueResponse> resume(@PathVariable UUID queueId) {
        return ResponseEntity.ok(queueService.setPaused(queueId, false));
    }
}
