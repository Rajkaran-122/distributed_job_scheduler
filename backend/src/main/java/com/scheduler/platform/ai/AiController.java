package com.scheduler.platform.ai;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI Insights")
public class AiController {

    private final AiInsightService aiInsightService;

    @GetMapping("/jobs/{jobId}/failure-explanation")
    @Operation(summary = "AI-generated plain-English explanation of a job's most recent failure")
    public ResponseEntity<Map<String, String>> explainFailure(@PathVariable UUID jobId) {
        return ResponseEntity.ok(Map.of("explanation", aiInsightService.explainFailure(jobId)));
    }

    @GetMapping("/jobs/{jobId}/retry-recommendation")
    @Operation(summary = "AI recommendation for improving this job's retry policy")
    public ResponseEntity<Map<String, String>> retryRecommendation(@PathVariable UUID jobId) {
        return ResponseEntity.ok(Map.of("recommendation", aiInsightService.recommendRetryPolicy(jobId)));
    }

    @GetMapping("/jobs/{jobId}/root-cause-analysis")
    @Operation(summary = "AI root cause analysis across a job's full attempt history")
    public ResponseEntity<Map<String, String>> rootCauseAnalysis(@PathVariable UUID jobId) {
        return ResponseEntity.ok(Map.of("analysis", aiInsightService.rootCauseAnalysis(jobId)));
    }
}
