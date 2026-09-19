package com.scheduler.platform.notification;

import com.scheduler.platform.repository.NotificationChannelRepository;
import com.scheduler.platform.worker.JobLifecycleEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Listens for JobLifecycleEvent (published by JobCompletionService) and fans out to every
 * subscribed notification channel for that organization. Runs @Async so a slow email/Slack
 * call never blocks the worker thread that just finished executing a job -- notification
 * delivery is best-effort and must never add latency to the execution pipeline itself.
 */
@Component
@RequiredArgsConstructor
public class NotificationDispatchListener {

    private final NotificationChannelRepository channelRepository;
    private final List<NotificationSender> senders;

    @Async
    @EventListener
    public void onJobLifecycleEvent(JobLifecycleEvent event) {
        if (!event.eventType().equals("job.dead_lettered") && !event.eventType().equals("job.retrying")) {
            return; // only alert on failure-adjacent events by default; success is too noisy to notify on
        }
        channelRepository.findByOrganization_IdAndActiveTrue(event.organizationId()).stream()
                .filter(ch -> ch.getSubscribedEvents().contains(event.eventType()))
                .forEach(ch -> senders.stream()
                        .filter(s -> s.channelType() == ch.getChannelType())
                        .findFirst()
                        .ifPresent(s -> s.send(ch.getConfig(),
                                "Job " + event.eventType(),
                                "Job " + event.jobId() + " transitioned to " + event.eventType())));
    }
}
