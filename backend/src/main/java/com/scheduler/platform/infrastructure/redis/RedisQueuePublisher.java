package com.scheduler.platform.infrastructure.redis;

import com.scheduler.platform.domain.model.Job;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Pushes a claimed job id onto its queue's Redis list. Workers BLPOP from these lists
 * rather than polling Postgres directly -- this is what keeps N horizontally-scaled
 * workers from hammering the database with claim queries; only the single leader
 * dispatcher touches Postgres for claiming (see architecture decision: hybrid poll/push).
 */
@Component
public class RedisQueuePublisher {

    private final StringRedisTemplate redisTemplate;

    public RedisQueuePublisher(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publish(Job job) {
        redisTemplate.opsForList().rightPush(
                RedisQueueNames.readyList(job.getQueue().getId()), job.getId().toString());
    }
}
