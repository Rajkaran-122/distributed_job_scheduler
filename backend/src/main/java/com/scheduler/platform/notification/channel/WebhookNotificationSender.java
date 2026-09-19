package com.scheduler.platform.notification.channel;

import com.scheduler.platform.domain.model.enums.NotificationChannelType;
import com.scheduler.platform.notification.NotificationSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

/**
 * Delivers to a generic webhook_endpoints-configured URL, HMAC-signing the payload
 * (X-Signature header) the same way Stripe/GitHub do, so the receiving service can
 * verify the request actually originated from this platform.
 */
@Slf4j
@Component
public class WebhookNotificationSender implements NotificationSender {

    private final WebClient webClient = WebClient.builder().build();

    @Override
    public NotificationChannelType channelType() {
        return NotificationChannelType.WEBHOOK;
    }

    @Override
    public void send(Map<String, Object> config, String subject, String message) {
        String url = (String) config.get("url");
        String secret = (String) config.get("secret");
        if (url == null) {
            log.warn("Webhook notification channel config missing 'url' -- skipping send");
            return;
        }
        String body = "{\"subject\":\"" + subject + "\",\"message\":\"" + message + "\"}";
        String signature = secret != null ? hmacSha256(body, secret) : "";

        try {
            webClient.post()
                    .uri(url)
                    .header("X-Signature", signature)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block(java.time.Duration.ofSeconds(10));
        } catch (Exception ex) {
            log.error("Failed to deliver webhook notification to {}", url, ex);
        }
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute HMAC signature", e);
        }
    }
}
