package com.scheduler.platform.analytics;

import com.scheduler.platform.worker.JobLifecycleEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Bridges internal JobLifecycleEvent publications to the WebSocket topic each
 * organization's dashboard is subscribed to, giving live status updates without the
 * dashboard needing to poll the REST API.
 */
@Component
@RequiredArgsConstructor
public class JobEventBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void onJobLifecycleEvent(JobLifecycleEvent event) {
        messagingTemplate.convertAndSend(
                "/topic/org/" + event.organizationId() + "/jobs",
                new JobEventMessage(event.jobId().toString(), event.eventType(), java.time.Instant.now().toString())
        );
    }

    public record JobEventMessage(String jobId, String eventType, String timestamp) {}
}
