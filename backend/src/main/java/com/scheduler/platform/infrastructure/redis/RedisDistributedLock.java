package com.scheduler.platform.infrastructure.redis;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collections;
import java.util.UUID;

/**
 * Redis-backed distributed lock (SET NX PX + token-checked release), used for two things
 * only: dispatcher leader election and user-defined job-level mutual exclusion. It is
 * NOT used for job claiming -- that is SKIP LOCKED against Postgres, the authoritative
 * store. Mixing two different locking systems for the same concern is how you get
 * split-brain bugs, so each is scoped to exactly one job here.
 */
@Component
public class RedisDistributedLock {

    // Release only succeeds if the value still matches the token this caller set --
    // otherwise a slow caller could release a lock that a different holder has since
    // acquired after this caller's lease already expired.
    private static final String RELEASE_SCRIPT = """
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end
            """;

    private final StringRedisTemplate redisTemplate;

    public RedisDistributedLock(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public record Lock(String key, String token) {}

    public java.util.Optional<Lock> tryAcquire(String key, Duration ttl) {
        String token = UUID.randomUUID().toString();
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, token, ttl);
        return Boolean.TRUE.equals(acquired) ? java.util.Optional.of(new Lock(key, token)) : java.util.Optional.empty();
    }

    /** Extends an already-held lock's TTL -- used by the leader to renew its term. */
    public boolean renew(Lock lock, Duration ttl) {
        String script = """
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('pexpire', KEYS[1], ARGV[2])
                else
                    return 0
                end
                """;
        Long result = redisTemplate.execute(new DefaultRedisScript<>(script, Long.class),
                Collections.singletonList(lock.key()), lock.token(), String.valueOf(ttl.toMillis()));
        return result != null && result == 1L;
    }

    public void release(Lock lock) {
        redisTemplate.execute(new DefaultRedisScript<>(RELEASE_SCRIPT, Long.class),
                Collections.singletonList(lock.key()), lock.token());
    }
}
