package com.scheduler.platform.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Default provider when no AI_PROVIDER is configured -- keeps the platform fully
 *  functional without an LLM API key, since AI features are an enhancement, not a
 *  dependency of the core scheduling engine. */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "none", matchIfMissing = true)
public class NoOpAiProviderClient implements AiProviderClient {

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        return "AI features are not configured on this deployment. Set AI_PROVIDER and AI_API_KEY to enable.";
    }

    @Override
    public boolean isEnabled() {
        return false;
    }
}
