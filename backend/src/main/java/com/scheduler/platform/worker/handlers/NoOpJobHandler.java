package com.scheduler.platform.worker.handlers;

import com.scheduler.platform.worker.JobExecutionContext;
import com.scheduler.platform.worker.JobHandler;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Used for load-testing, demos, and integration tests -- simply "succeeds" after an
 *  optional simulated delay (payload key "simulateDelayMs"), or throws if
 *  "simulateFailure": true is present, useful for exercising retry/DLQ paths on demand. */
@Component
public class NoOpJobHandler implements JobHandler {

    @Override
    public String handlerType() {
        return "noop";
    }

    @Override
    public Map<String, Object> execute(JobExecutionContext context) throws InterruptedException {
        Object delay = context.payload().get("simulateDelayMs");
        if (delay instanceof Number n) {
            Thread.sleep(n.longValue());
        }
        if (Boolean.TRUE.equals(context.payload().get("simulateFailure"))) {
            throw new RuntimeException("Simulated failure requested via payload.simulateFailure");
        }
        return Map.of("status", "ok", "attempt", context.attemptNumber());
    }
}
