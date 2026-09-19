package com.scheduler.platform.domain.policy;

import com.cronutils.model.Cron;
import com.cronutils.model.CronType;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

/**
 * Wraps cron-utils to compute the next fire time for a CRON job, honoring the job's own
 * IANA timezone (jobs.timezone) rather than assuming UTC or server-local time -- this
 * matters because "run at 9am" means something different in each customer's timezone,
 * and DST transitions must be handled correctly (cron-utils does this; hand-rolled cron
 * math notoriously does not).
 */
public final class CronCalculator {

    private static final CronParser PARSER =
            new CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX));

    private CronCalculator() {}

    public static Optional<Instant> nextFireTime(String cronExpression, String timezone, Instant after) {
        Cron cron = PARSER.parse(cronExpression);
        ZonedDateTime afterZoned = after.atZone(ZoneId.of(timezone));
        return ExecutionTime.forCron(cron)
                .nextExecution(afterZoned)
                .map(ZonedDateTime::toInstant);
    }
}
