package com.scheduler.platform.worker;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class JobHandlerRegistry {

    private final List<JobHandler> handlers;
    private Map<String, JobHandler> byType;

    public JobHandlerRegistry(List<JobHandler> handlers) {
        this.handlers = handlers;
    }

    @PostConstruct
    void index() {
        byType = handlers.stream().collect(Collectors.toMap(JobHandler::handlerType, h -> h));
    }

    public Optional<JobHandler> find(String handlerType) {
        return Optional.ofNullable(byType.get(handlerType));
    }
}
