package com.scheduler.platform.ai;

/**
 * Provider-agnostic abstraction over "call an LLM with a prompt, get text back".
 * Concrete implementations (AnthropicAiProviderClient, OpenAiProviderClient, or a
 * NoOpAiProviderClient when AI features are disabled) are selected via
 * app.ai.provider -- swapping providers never touches any of the AI feature services
 * below, which only depend on this interface.
 */
public interface AiProviderClient {
    String complete(String systemPrompt, String userPrompt);
    boolean isEnabled();
}
