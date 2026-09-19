package com.scheduler.platform.worker;

import java.util.Map;

/**
 * Strategy pattern: one implementation per `handler_type` a job can declare. Registered
 * automatically as a Spring bean and looked up by name in JobHandlerRegistry -- adding a
 * new job type to the platform means writing one new JobHandler bean, not touching the
 * dispatcher, worker loop, or retry engine.
 */
public interface JobHandler {

    /** Must match jobs.handler_type exactly, e.g. "send-invoice-email". */
    String handlerType();

    /**
     * Executes the job. Implementations MUST be idempotent with respect to
     * `context.idempotencyKey()` -- at-least-once delivery means this method can be
     * called more than once for the same logical attempt (e.g. after a worker crash and
     * lease reclaim followed by the original process actually completing late).
     */
    Map<String, Object> execute(JobExecutionContext context) throws Exception;
}
