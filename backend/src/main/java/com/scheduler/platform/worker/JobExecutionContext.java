package com.scheduler.platform.worker;

import java.util.Map;
import java.util.UUID;

public record JobExecutionContext(
        UUID jobId,
        UUID organizationId,
        int attemptNumber,
        String idempotencyKey,
        Map<String, Object> payload,
        LeaseRenewer leaseRenewer
) {
    /** Injected so a long-running handler can extend its own lease mid-execution instead
     *  of relying solely on the background renewal thread, e.g. before a known-slow step. */
    public interface LeaseRenewer {
        void renew();
    }
}
