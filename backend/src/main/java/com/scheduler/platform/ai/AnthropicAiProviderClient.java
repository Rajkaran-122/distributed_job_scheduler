package com.scheduler.platform.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "anthropic")
public class AnthropicAiProviderClient implements AiProviderClient {

    private final WebClient webClient;
    private final String model;

    public AnthropicAiProviderClient(WebClient.Builder builder,
                                      org.springframework.core.env.Environment env) {
        this.webClient = builder
                .baseUrl("https://api.anthropic.com/v1")
                .defaultHeader("x-api-key", env.getProperty("app.ai.api-key"))
                .defaultHeader("anthropic-version", "2023-06-01")
                .build();
        this.model = env.getProperty("app.ai.model", "claude-sonnet-4-6");
    }

    @Override
    @SuppressWarnings("unchecked")
    public String complete(String systemPrompt, String userPrompt) {
        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 1000,
                "system", systemPrompt,
                "messages", List.of(Map.of("role", "user", "content", userPrompt))
        );
        Map<String, Object> response = webClient.post()
                .uri("/messages")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(30))
                .block();

        if (response == null) return "";
        List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
        return content.stream()
                .filter(c -> "text".equals(c.get("type")))
                .map(c -> (String) c.get("text"))
                .findFirst()
                .orElse("");
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
