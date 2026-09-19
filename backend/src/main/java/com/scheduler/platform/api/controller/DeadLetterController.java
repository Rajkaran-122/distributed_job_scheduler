package com.scheduler.platform.api.controller;

import com.scheduler.platform.api.dto.response.DeadLetterJobResponse;
import com.scheduler.platform.api.dto.response.PagedResponse;
import com.scheduler.platform.security.rbac.MemberRoleLevel;
import com.scheduler.platform.security.rbac.RequireRole;
import com.scheduler.platform.service.DeadLetterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dead-letter-queue")
@RequiredArgsConstructor
@Tag(name = "Dead Letter Queue")
public class DeadLetterController {

    private final DeadLetterService deadLetterService;

    @GetMapping
    @Operation(summary = "List unresolved dead-lettered jobs")
    public ResponseEntity<PagedResponse<DeadLetterJobResponse>> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(deadLetterService.list(page, Math.min(size, 100)));
    }

    @PostMapping("/{id}/requeue")
    @RequireRole(MemberRoleLevel.DEVELOPER)
    @Operation(summary = "Requeue a dead-lettered job: resets the original job to PENDING with a fresh attempt count")
    public ResponseEntity<Void> requeue(@PathVariable UUID id) {
        deadLetterService.requeue(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/discard")
    @RequireRole(MemberRoleLevel.DEVELOPER)
    @Operation(summary = "Permanently discard a dead-lettered job (marks it resolved, no requeue)")
    public ResponseEntity<Void> discard(@PathVariable UUID id) {
        deadLetterService.discard(id);
        return ResponseEntity.noContent().build();
    }
}
