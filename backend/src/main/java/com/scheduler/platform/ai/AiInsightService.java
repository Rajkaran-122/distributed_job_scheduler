package com.scheduler.platform.ai;

import com.scheduler.platform.api.exception.ResourceNotFoundException;
import com.scheduler.platform.domain.model.AiInsight;
import com.scheduler.platform.domain.model.Job;
import com.scheduler.platform.domain.model.JobExecution;
import com.scheduler.platform.repository.AiInsightRepository;
import com.scheduler.platform.repository.JobExecutionRepository;
import com.scheduler.platform.repository.JobRepository;
import com.scheduler.platform.security.rbac.TenantPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implements the platform's AI feature set. Every method follows the same shape:
 * build a fingerprint of the relevant input -> check ai_insights cache -> call the LLM
 * only on a cache miss -> persist and return. This means two jobs failing with an
 * identical error message and config only ever trigger ONE LLM call between them
 * (see ai_insights table comment), which matters a lot at any real job volume.
 */
@Service
@RequiredArgsConstructor
public class AiInsightService {

    private final AiProviderClient aiProviderClient;
    private final AiInsightRepository aiInsightRepository;
    private final JobRepository jobRepository;
    private final JobExecutionRepository jobExecutionRepository;

    private static final String FAILURE_EXPLANATION_SYSTEM_PROMPT = """
            You are an expert SRE assistant embedded in a job scheduling platform. Given a
            job's configuration and its most recent failure, explain in 2-3 plain-English
            sentences what likely went wrong and why. Be specific and concrete, avoid
            generic advice, and do not restate the error message verbatim -- interpret it.
            """;

    private static final String RETRY_RECOMMENDATION_SYSTEM_PROMPT = """
            You are an expert SRE assistant. Given a job's current retry policy and its
            recent failure history, recommend a specific, concrete change to
            max_retries, backoff_strategy, base_delay_seconds, or timeout_seconds --
            or state that the current policy looks appropriate. Respond in 2-4 sentences.
            """;

    private static final String ROOT_CAUSE_SYSTEM_PROMPT = """
            You are an expert SRE assistant performing root cause analysis. Given a job's
            full execution/attempt history, identify the most likely underlying cause of
            the failure pattern (e.g. downstream dependency issue, resource exhaustion,
            bad input data, misconfiguration). Respond in 3-5 sentences with your reasoning.
            """;

    @Transactional
    public String explainFailure(UUID jobId) {
        Job job = findOwnedJob(jobId);
        JobExecution lastExecution = jobExecutionRepository.findTopByJob_IdOrderByAttemptNumberDesc(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("JobExecution", jobId));

        String input = "job=" + job.getHandlerType() + " error=" + lastExecution.getErrorMessage();
        return cachedOrGenerate("FAILURE_EXPLANATION", job, input, FAILURE_EXPLANATION_SYSTEM_PROMPT,
                "Job handler: " + job.getHandlerType() + "\nQueue: " + job.getQueue().getName() +
                "\nAttempt: " + lastExecution.getAttemptNumber() + "\nError: " + lastExecution.getErrorMessage());
    }

    @Transactional
    public String recommendRetryPolicy(UUID jobId) {
        Job job = findOwnedJob(jobId);
        List<JobExecution> history = jobExecutionRepository.findByJob_IdOrderByAttemptNumberDesc(jobId);

        String input = "job=" + jobId + " attempts=" + history.size() + " strategy=" + job.getBackoffStrategy();
        String context = "Current policy: maxRetries=" + job.getMaxRetries() +
                ", backoffStrategy=" + job.getBackoffStrategy() +
                ", baseDelaySeconds=" + job.getBaseDelaySeconds() +
                ", timeoutSeconds=" + job.getTimeoutSeconds() +
                "\nRecent attempts: " + history.size() +
                "\nMost recent error: " + (history.isEmpty() ? "none" : history.get(0).getErrorMessage());

        return cachedOrGenerate("RETRY_RECOMMENDATION", job, input, RETRY_RECOMMENDATION_SYSTEM_PROMPT, context);
    }

    @Transactional
    public String rootCauseAnalysis(UUID jobId) {
        Job job = findOwnedJob(jobId);
        List<JobExecution> history = jobExecutionRepository.findByJob_IdOrderByAttemptNumberDesc(jobId);

        StringBuilder context = new StringBuilder("Job: " + job.getHandlerType() + "\nAttempt history:\n");
        history.forEach(e -> context.append("- attempt ").append(e.getAttemptNumber())
                .append(": ").append(e.getStatus())
                .append(e.getErrorMessage() != null ? " (" + e.getErrorMessage() + ")" : "")
                .append("\n"));

        String input = "job=" + jobId + " history=" + history.size();
        return cachedOrGenerate("ROOT_CAUSE_ANALYSIS", job, input, ROOT_CAUSE_SYSTEM_PROMPT, context.toString());
    }

    private String cachedOrGenerate(String insightType, Job job, String fingerprintInput,
                                     String systemPrompt, String userPrompt) {
        String fingerprint = sha256(fingerprintInput);
        Optional<AiInsight> cached = aiInsightRepository
                .findByInsightTypeAndInputFingerprintAndExpiresAtAfter(insightType, fingerprint, Instant.now());
        if (cached.isPresent()) {
            return cached.get().getGeneratedText();
        }

        String generated = aiProviderClient.complete(systemPrompt, userPrompt);

        AiInsight insight = AiInsight.builder()
                .organization(job.getOrganization())
                .job(job)
                .insightType(insightType)
                .inputFingerprint(fingerprint)
                .generatedText(generated)
                .modelUsed(aiProviderClient.isEnabled() ? "configured-provider" : "none")
                .build();
        aiInsightRepository.save(insight);
        return generated;
    }

    private Job findOwnedJob(UUID jobId) {
        return jobRepository.findByIdAndOrganization_Id(jobId, currentPrincipal().organizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
    }

    private TenantPrincipal currentPrincipal() {
        return (TenantPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private String sha256(String value) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
