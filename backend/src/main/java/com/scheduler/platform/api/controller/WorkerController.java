package com.scheduler.platform.api.controller;

import com.scheduler.platform.api.dto.response.WorkerResponse;
import com.scheduler.platform.domain.model.Worker;
import com.scheduler.platform.repository.WorkerRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Fleet visibility only -- see Worker entity javadoc. Not scoped by organization since
 * workers may serve a shared/global pool (organization_id nullable on the workers table).
 */
@RestController
@RequestMapping("/api/v1/workers")
@RequiredArgsConstructor
@Tag(name = "Workers")
public class WorkerController {

    private final WorkerRepository workerRepository;

    @GetMapping
    @Operation(summary = "List all registered workers with live heartbeat/load info for the fleet monitoring dashboard")
    public ResponseEntity<List<WorkerResponse>> list() {
        List<WorkerResponse> workers = workerRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(workers);
    }

    private WorkerResponse toResponse(Worker w) {
        return new WorkerResponse(w.getId(), w.getHostname(), w.getPid(), w.getVersion(),
                w.getStatus().name(), w.getQueues(), w.getMaxConcurrency(), w.getCurrentLoad(),
                w.getLastHeartbeatAt(), w.getRegisteredAt());
    }
}
