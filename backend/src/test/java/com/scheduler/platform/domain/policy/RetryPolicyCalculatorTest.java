package com.scheduler.platform.domain.policy;

import com.scheduler.platform.domain.model.enums.BackoffStrategy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit tests -- no Spring context needed, which is exactly the payoff of keeping
 * this calculation as framework-free domain logic (see RetryPolicyCalculator javadoc).
 */
class RetryPolicyCalculatorTest {

    private final Instant now = Instant.parse("2026-01-01T00:00:00Z");

    @Test
    void fixedStrategy_alwaysReturnsSameDelay() {
        Instant first = RetryPolicyCalculator.computeNextAttempt(BackoffStrategy.FIXED, 1, 10, 3600, now);
        Instant fifth = RetryPolicyCalculator.computeNextAttempt(BackoffStrategy.FIXED, 5, 10, 3600, now);

        assertThat(first).isEqualTo(now.plusSeconds(10));
        assertThat(fifth).isEqualTo(now.plusSeconds(10));
    }

    @Test
    void linearStrategy_growsByConstantIncrement() {
        Instant attempt1 = RetryPolicyCalculator.computeNextAttempt(BackoffStrategy.LINEAR, 1, 5, 3600, now);
        Instant attempt3 = RetryPolicyCalculator.computeNextAttempt(BackoffStrategy.LINEAR, 3, 5, 3600, now);

        assertThat(attempt1).isEqualTo(now.plusSeconds(5));
        assertThat(attempt3).isEqualTo(now.plusSeconds(15));
    }

    @Test
    void exponentialStrategy_doublesEachAttempt() {
        Instant attempt1 = RetryPolicyCalculator.computeNextAttempt(BackoffStrategy.EXPONENTIAL, 1, 2, 3600, now);
        Instant attempt2 = RetryPolicyCalculator.computeNextAttempt(BackoffStrategy.EXPONENTIAL, 2, 2, 3600, now);
        Instant attempt3 = RetryPolicyCalculator.computeNextAttempt(BackoffStrategy.EXPONENTIAL, 3, 2, 3600, now);

        assertThat(attempt1).isEqualTo(now.plusSeconds(2));
        assertThat(attempt2).isEqualTo(now.plusSeconds(4));
        assertThat(attempt3).isEqualTo(now.plusSeconds(8));
    }

    @Test
    void exponentialJitter_neverExceedsExponentialUpperBound() {
        // Full jitter should always land in (now, now + exponentialDelay], never beyond it.
        Instant upperBound = now.plusSeconds(32); // 2 * 2^4 for attempt 5
        for (int i = 0; i < 200; i++) {
            Instant result = RetryPolicyCalculator.computeNextAttempt(BackoffStrategy.EXPONENTIAL_JITTER, 5, 2, 3600, now);
            assertThat(result).isAfter(now);
            assertThat(result).isBeforeOrEqualTo(upperBound);
        }
    }

    @ParameterizedTest
    @EnumSource(BackoffStrategy.class)
    void delayIsAlwaysCappedAtMaxDelaySeconds(BackoffStrategy strategy) {
        // Attempt 20 would produce an enormous delay under exponential growth without capping.
        Instant result = RetryPolicyCalculator.computeNextAttempt(strategy, 20, 10, 300, now);
        assertThat(result).isBeforeOrEqualTo(now.plusSeconds(300));
    }

    @Test
    void neverSchedulesRetryInThePast() {
        Instant result = RetryPolicyCalculator.computeNextAttempt(BackoffStrategy.FIXED, 1, 0, 3600, now);
        assertThat(result).isAfter(now);
    }
}
