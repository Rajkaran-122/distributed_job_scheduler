package com.scheduler.platform.worker.handlers;

import com.scheduler.platform.worker.JobExecutionContext;
import com.scheduler.platform.worker.JobHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

/**
 * Built-in handler: calls an arbitrary HTTP endpoint with the job payload as the request
 * body. Registered under handler_type = "http-webhook" -- the most common generic job
 * type ("call this URL at this time/on this schedule").
 */
@Component
@RequiredArgsConstructor
public class HttpWebhookJobHandler implements JobHandler {

    private final WebClient.Builder webClientBuilder;

    @Override
    public String handlerType() {
        return "http-webhook";
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> execute(JobExecutionContext context) {
        String url = (String) context.payload().get("url");
        if (url == null) {
            throw new IllegalArgumentException("Payload must include 'url' for http-webhook jobs");
        }
        Map<String, Object> body = (Map<String, Object>) context.payload().getOrDefault("body", Map.of());

        Map<String, Object> response = webClientBuilder.build()
                .post()
                .uri(url)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(30))
                .blockOptional()
                .map(m -> (Map<String, Object>) m)
                .orElse(Map.of());

        return Map.of("status", "delivered", "response", response);
    }
}
