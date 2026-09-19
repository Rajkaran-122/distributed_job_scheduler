package com.scheduler.platform.domain.policy;

import com.scheduler.platform.domain.model.enums.BackoffStrategy;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Pure, framework-free domain logic (no Spring, no JPA) computing the delay before the
 * next retry attempt -- deliberately isolated here so it is trivially unit-testable and
 * so the backoff math is never duplicated between the worker and any future admin tool
 * that needs to preview "when would this retry next fire".
 *
 * Strategy comparison (why EXPONENTIAL_JITTER is the default):
 *  - FIXED: same delay every time. Simple, but under a transient outage every failed job
 *    retries in lockstep, creating synchronized retry storms against the downstream system
 *    the moment it recovers.
 *  - LINEAR: delay grows by a constant increment. Better than fixed, but for jobs that can
 *    fail many times, linear growth is too slow to meaningfully back off a struggling
 *    dependency.
 *  - EXPONENTIAL: delay doubles each attempt. Backs off aggressively, but many jobs
 *    failing at the same time still retry at the same *rate*, so they stay synchronized
 *    with each other even as the delay grows -- still a thundering-herd risk.
 *  - EXPONENTIAL_JITTER: exponential growth PLUS randomized jitter on top, which is what
 *    AWS's own architecture blog (and most production schedulers -- Sidekiq, Celery,
 *    Temporal) converged on specifically to de-synchronize retries across many jobs
 *    failing against the same downstream dependency at once. This is why it is the
 *    system default; FIXED/LINEAR/EXPONENTIAL remain available as explicit per-job
 *    overrides for callers who have a specific reason to want deterministic timing
 *    (e.g. a test job whose retry timing an integration test asserts on).
 */
public final class RetryPolicyCalculator {

    private RetryPolicyCalculator() {}

    public static Instant computeNextAttempt(BackoffStrategy strategy, int attemptNumber,
                                              int baseDelaySeconds, int maxDelaySeconds, Instant now) {
        long delaySeconds = switch (strategy) {
            case FIXED -> baseDelaySeconds;
            case LINEAR -> (long) baseDelaySeconds * attemptNumber;
            case EXPONENTIAL -> (long) (baseDelaySeconds * Math.pow(2, attemptNumber - 1));
            case EXPONENTIAL_JITTER -> withJitter((long) (baseDelaySeconds * Math.pow(2, attemptNumber - 1)));
        };
        delaySeconds = Math.min(delaySeconds, maxDelaySeconds);
        delaySeconds = Math.max(delaySeconds, 1); // never schedule a retry in the past
        return now.plus(Duration.ofSeconds(delaySeconds));
    }

    /** Full jitter: a uniformly random delay between 0 and the computed exponential value.
     *  This is the "Full Jitter" strategy from AWS's backoff research -- it spreads retry
     *  load the most evenly of the jitter variants (as opposed to "Equal Jitter", which
     *  only randomizes half the range and so still leaves some synchronization). */
    private static long withJitter(long exponentialDelay) {
        return ThreadLocalRandom.current().nextLong(1, Math.max(2, exponentialDelay + 1));
    }
}
