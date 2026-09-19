package com.scheduler.platform.notification.channel;

import com.scheduler.platform.domain.model.enums.NotificationChannelType;
import com.scheduler.platform.notification.NotificationSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailNotificationSender implements NotificationSender {

    private final JavaMailSender mailSender;

    @Override
    public NotificationChannelType channelType() {
        return NotificationChannelType.EMAIL;
    }

    @Override
    public void send(Map<String, Object> config, String subject, String message) {
        String to = (String) config.get("email");
        if (to == null) {
            log.warn("Email notification channel config missing 'email' key -- skipping send");
            return;
        }
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(to);
        mail.setSubject(subject);
        mail.setText(message);
        try {
            mailSender.send(mail);
        } catch (Exception ex) {
            // A failed alert must never crash the job pipeline that triggered it --
            // log and move on; notification delivery has its own independent retry
            // story (webhook_deliveries table) that email intentionally does not share.
            log.error("Failed to send email notification to {}", to, ex);
        }
    }
}
