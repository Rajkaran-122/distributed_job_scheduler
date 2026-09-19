package com.scheduler.platform.infrastructure.redis;

import java.util.UUID;

/** Naming convention for the Redis lists workers BLPOP from -- one list per queue so
 *  priority/isolation between queues holds at the transport layer too, not just in SQL. */
public final class RedisQueueNames {
    private RedisQueueNames() {}

    public static String readyList(UUID queueId) {
        return "scheduler:queue:" + queueId + ":ready";
    }

    public static String jobLockKey(String uniqueKey) {
        return "scheduler:job-lock:" + uniqueKey;
    }
}
