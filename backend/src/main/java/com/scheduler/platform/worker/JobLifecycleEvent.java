package com.scheduler.platform.worker;

import java.util.UUID;

/** Published on every terminal/retry transition; consumed by the notification module
 *  (email/Slack/webhook dispatch) and the WebSocket broadcaster for the live dashboard. */
public record JobLifecycleEvent(UUID jobId, UUID organizationId, String eventType) {}
