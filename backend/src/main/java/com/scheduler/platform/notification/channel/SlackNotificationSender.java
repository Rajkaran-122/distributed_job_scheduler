package com.scheduler.platform.notification.channel;

import com.scheduler.platform.domain.model.enums.NotificationChannelType;
import com.scheduler.platform.notification.NotificationSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Slf4j
@Component
public class SlackNotificationSender implements NotificationSender {

    private final WebClient webClient = WebClient.builder().build();

    @Override
    public NotificationChannelType channelType() {
        return NotificationChannelType.SLACK;
    }

    @Override
    public void send(Map<String, Object> config, String subject, String message) {
        String webhookUrl = (String) config.get("slack_webhook_url");
        if (webhookUrl == null) {
            log.warn("Slack notification channel config missing 'slack_webhook_url' -- skipping send");
            return;
        }
        try {
            webClient.post()
                    .uri(webhookUrl)
                    .bodyValue(Map.of("text", "*" + subject + "*\n" + message))
                    .retrieve()
                    .toBodilessEntity()
                    .block(java.time.Duration.ofSeconds(10));
        } catch (Exception ex) {
            log.error("Failed to deliver Slack notification", ex);
        }
    }
}
