package com.scheduler.platform.notification;

import com.scheduler.platform.domain.model.enums.NotificationChannelType;

import java.util.Map;

/** Strategy interface: one implementation per channel type (email, Slack, webhook). */
public interface NotificationSender {
    NotificationChannelType channelType();
    void send(Map<String, Object> config, String subject, String message);
}
