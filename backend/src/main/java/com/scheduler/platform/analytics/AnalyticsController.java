package com.scheduler.platform.analytics;

import com.scheduler.platform.api.dto.response.QueueStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/queue-stats")
    @Operation(summary = "Per-queue pending/running/failed/dead-lettered counts for the dashboard")
    public ResponseEntity<List<QueueStatsResponse>> queueStats() {
        return ResponseEntity.ok(analyticsService.queueStats());
    }
}
